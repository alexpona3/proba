// api.ow64.alexpona3.store — Worker для создания счетов в ЮKassa
export default {
  async fetch(request) {
    // Разрешаем запросы только с вашего домена
    const origin = request.headers.get('Origin');
    if (origin && !origin.includes('ow64.alexpona3.store')) {
      return new Response('Forbidden', { status: 403 });
    }

    // Ответ на preflight-запросы (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { email } = await request.json();
      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ error: 'Неверный email' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ВАШИ ДАННЫЕ ЮKASSA
      const SHOP_ID = '1395242';
      const SECRET_KEY = 'live_gK5EAEU48ae_uEahz0LhjpGCCv_kYSZKeStfPe7e9Vk
'; // ?? ЗАМЕНИТЕ НА СВОЙ СЕКРЕТНЫЙ КЛЮЧ

      const amount = '4500.00';
      const description = 'OW64 — персональная матрица';

      // Формируем запрос на создание счёта
      const invoiceData = {
        payment_data: {
          amount: { value: amount, currency: 'RUB' },
          description: description,
          metadata: { user_email: email },
        },
        cart: [
          {
            description: 'OW64 — персональная матрица достижения цели',
            price: { value: amount, currency: 'RUB' },
            quantity: 1,
          },
        ],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        delivery_method_data: { type: 'self' },
      };

      const response = await fetch('https://api.yookassa.ru/v3/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotence-Key': crypto.randomUUID(),
          'Authorization': 'Basic ' + btoa(SHOP_ID + ':' + SECRET_KEY),
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (response.ok && result.url) {
        return new Response(JSON.stringify({ url: result.url }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        console.error('Ошибка ЮKassa:', result);
        return new Response(JSON.stringify({ error: 'Не удалось создать счёт' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Внутренняя ошибка сервера' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
