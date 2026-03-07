import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test credentials
const MANAGER = { email: 'admin@lomando.com', password: '123456' };
const DRIVER = { email: 'jorge@driver.com', password: '123456' };

// Shared state file between tests
const STATE_FILE = path.join(__dirname, '.test-state.json');

function saveState(data: Record<string, string>) {
  const existing = loadState();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...existing, ...data }));
}

function loadState(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

// Helper: login and wait for dashboard
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL('/', { timeout: 10000 });
  await expect(page.getByTestId('welcome-title')).toBeVisible();
}

// Ensure sequential execution
test.describe.configure({ mode: 'serial' });

test.describe('Flujo completo de entrega', () => {

  test.beforeAll(() => {
    // Clean state from previous runs
    try { fs.unlinkSync(STATE_FILE); } catch {}
  });

  test.afterAll(() => {
    try { fs.unlinkSync(STATE_FILE); } catch {}
  });

  test('1. Manager inicia sesion y ve el dashboard', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await expect(page.getByTestId('welcome-title')).toContainText('Bienvenido');
  });

  test('2. Manager crea una orden', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);

    await page.goto('/orders/new');
    await expect(page.getByTestId('order-customer-select')).toBeVisible();

    // Esperar a que carguen los clientes (option con Geraldo)
    const customerSelect = page.getByTestId('order-customer-select');
    await expect(customerSelect.locator('option')).not.toHaveCount(1, { timeout: 10000 });

    // Seleccionar el segundo option (primer cliente)
    const secondOption = customerSelect.locator('option').nth(1);
    const secondValue = await secondOption.getAttribute('value');
    await customerSelect.selectOption(secondValue!);

    // Verificar que se selecciono
    await expect(customerSelect).not.toHaveValue('', { timeout: 3000 });

    // Descripcion
    await page.getByTestId('order-description').fill('Test E2E - Envio de prueba automatizado');

    // Agregar nueva direccion de origen
    await page.getByTestId('btn-new-address').click();
    await page.getByTestId('origin-street').fill('Av. 18 de Julio');
    await page.getByTestId('origin-number').fill('1234');

    // Localidad de origen
    const originCityInput = page.locator('input[placeholder="Escribí para buscar..."]').first();
    await originCityInput.fill('Centro');
    const originSuggestion = page.locator('ul.absolute li').first();
    await originSuggestion.waitFor({ timeout: 5000 }).catch(() => {});
    if (await originSuggestion.isVisible()) {
      await originSuggestion.click();
    } else {
      await originCityInput.clear();
      await originCityInput.fill('Centro, Montevideo');
    }

    // Contacto de origen
    await page.getByTestId('origin-contact').fill('Juan Test');
    await page.getByTestId('origin-phone').fill('099111222');

    // Destino 1
    const dest0 = page.getByTestId('destination-0');
    await dest0.locator('input[placeholder="Av. Principal"]').fill('Bvar. Artigas');
    await dest0.locator('input[placeholder="123"]').fill('567');

    // Localidad del destino
    const destCityInput = dest0.locator('input[placeholder="Escribí para buscar..."]');
    await destCityInput.fill('Pocitos');
    const destSuggestion = dest0.locator('ul li').first();
    await destSuggestion.waitFor({ timeout: 5000 }).catch(() => {});
    if (await destSuggestion.isVisible()) {
      await destSuggestion.click();
    } else {
      await destCityInput.clear();
      await destCityInput.fill('Pocitos, Montevideo');
    }

    // Contacto del destino
    await dest0.locator('input[placeholder="Nombre"]').fill('Maria Test');
    await dest0.locator('input[placeholder="099123456"]').fill('099333444');

    // Crear orden (scroll into view first)
    await page.getByTestId('btn-create-order').scrollIntoViewIfNeeded();
    await page.getByTestId('btn-create-order').click();

    // Debe redirigir al detalle de la orden
    await page.waitForURL(/\/orders\/\d+/, { timeout: 15000 });
    await expect(page.getByTestId('order-code')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('order-status')).toContainText('Pendiente');

    // Guardar el codigo de orden
    const codeText = await page.getByTestId('order-code').textContent();
    const orderCode = codeText?.replace('#', '') || '';
    expect(orderCode).toBeTruthy();

    // Obtener codigo de step del destino
    const stepCodes = page.locator('span.font-mono').filter({ hasText: /^D\d+$/ });
    const stepCount = await stepCodes.count();
    let stepCode = '';
    if (stepCount > 0) {
      stepCode = (await stepCodes.last().textContent()) || '';
    }

    saveState({ orderCode, stepCode });
  });

  test('3. Manager ve la orden en el listado', async ({ page }) => {
    const { orderCode } = loadState();
    test.skip(!orderCode, 'Necesita el test 2');

    await login(page, MANAGER.email, MANAGER.password);
    await page.goto('/orders');
    await expect(page.locator(`text=${orderCode}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Driver busca la orden', async ({ page }) => {
    const { orderCode } = loadState();
    test.skip(!orderCode, 'Necesita el test 2');

    await login(page, DRIVER.email, DRIVER.password);
    await page.goto(`/seguimiento?code=${orderCode}`);
    await expect(page.locator(`text=#${orderCode}`)).toBeVisible({ timeout: 10000 });
  });

  test('5. Driver confirma retiro', async ({ page }) => {
    const { orderCode } = loadState();
    test.skip(!orderCode, 'Necesita el test 2');

    await login(page, DRIVER.email, DRIVER.password);
    await page.goto(`/seguimiento?code=${orderCode}`);
    await expect(page.locator(`text=#${orderCode}`)).toBeVisible({ timeout: 10000 });

    const pickupBtn = page.getByTestId('btn-confirm-pickup');
    await expect(pickupBtn).toBeVisible({ timeout: 5000 });
    await pickupBtn.click();

    // Despues de confirmar retiro, la pagina refresca y muestra "Salir a entregar" (status 2)
    await expect(page.getByTestId('btn-start-delivery')).toBeVisible({ timeout: 10000 });
  });

  test('6. Driver sale a entregar', async ({ page }) => {
    const { orderCode } = loadState();
    test.skip(!orderCode, 'Necesita el test 2');

    await login(page, DRIVER.email, DRIVER.password);
    await page.goto(`/seguimiento?code=${orderCode}`);
    await expect(page.locator(`text=#${orderCode}`)).toBeVisible({ timeout: 10000 });

    const deliveryBtn = page.getByTestId('btn-start-delivery');
    await expect(deliveryBtn).toBeVisible({ timeout: 5000 });
    await deliveryBtn.click();

    // Despues de salir a entregar, la pagina refresca y muestra "En curso" (status 3)
    await expect(page.locator('text=En curso').first()).toBeVisible({ timeout: 10000 });
  });

  test('7. Driver marca en camino y entrega el paquete', async ({ page }) => {
    const { orderCode } = loadState();
    test.skip(!orderCode, 'Necesita el test 2');

    await login(page, DRIVER.email, DRIVER.password);
    await page.goto(`/seguimiento?code=${orderCode}`);
    await expect(page.locator(`text=#${orderCode}`)).toBeVisible({ timeout: 10000 });

    // Marcar step en camino
    const enCaminoBtn = page.getByTestId('btn-en-camino-0');
    await expect(enCaminoBtn).toBeVisible({ timeout: 5000 });

    // Click y esperar la respuesta de la API
    const [stepResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/steps/') && resp.request().method() === 'PUT', { timeout: 15000 }),
      enCaminoBtn.click(),
    ]);
    expect(stepResponse.ok()).toBeTruthy();

    // Esperar a que aparezca "Entregar" despues del refresh
    await expect(page.getByTestId('btn-deliver-0')).toBeVisible({ timeout: 15000 });

    // Entregar el paquete
    await page.getByTestId('btn-deliver-0').click();

    // Modal de entrega
    await expect(page.getByTestId('delivery-receiver-name')).toBeVisible();
    await page.getByTestId('delivery-receiver-name').fill('Carlos Receptor');
    await page.getByTestId('delivery-receiver-ci').fill('1.234.567-8');
    await page.getByTestId('delivery-confirm').click();

    // Despues de entregar, el step muestra "Entregado"
    await expect(page.locator('text=Entregado').first()).toBeVisible({ timeout: 10000 });
  });

  test('8. Manager verifica orden completada', async ({ page }) => {
    const { orderCode } = loadState();
    test.skip(!orderCode, 'Necesita el test 2');

    await login(page, MANAGER.email, MANAGER.password);

    // Ir al listado y buscar la orden
    await page.goto('/orders');
    const searchInput = page.locator('input[placeholder="Buscar por codigo..."]');
    await searchInput.fill(orderCode);

    // Verificar que la orden aparece con estado completado
    await expect(page.locator(`text=${orderCode}`).first()).toBeVisible({ timeout: 10000 });
    // El badge de estado es un span con clase rounded-full
    await expect(page.locator('span.rounded-full', { hasText: 'Completado' })).toBeVisible({ timeout: 5000 });
  });

  test('9. Tracking publico con codigo de step', async ({ page }) => {
    const { stepCode } = loadState();
    test.skip(!stepCode, 'Necesita codigo de step');

    // Sin login, ir a tracking publico
    await page.goto('/seguimiento');
    await expect(page.getByTestId('seguimiento-submit')).toBeVisible({ timeout: 10000 });

    // Buscar por step code
    await page.locator('input[placeholder*="D000"]').fill(stepCode);
    await page.getByTestId('seguimiento-submit').click();

    // Debe mostrar info del step
    await expect(page.locator(`text=#${stepCode}`)).toBeVisible({ timeout: 15000 });
    // Debe mostrar estado Entregado
    await expect(page.locator('text=Entregado').first()).toBeVisible({ timeout: 5000 });
  });
});
