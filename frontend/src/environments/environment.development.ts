export const environment = {
    production: false,
    apiUrl: 'http://hidratan.com.ar:9000',
    endpoints: {
      auth: {
        base: '/api/v1/auth',
        login: '/authenticate',
        register: '/register'
      },
      management: {
        base: '/api/v1/managment',
        users: '/users',
        disable: '/disable'
      },
      delivery: {
        base: '/delivery',
        view: '/view',
        create: '/create',
        update: '/update'
      },
      products: {
        base: '/products',
        toClient: '/toClient'
      },
      clients: {
        base: '/delivery',
        clients : '/clients'
      }
    }
  };
  