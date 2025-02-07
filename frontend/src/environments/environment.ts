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
      base: '/api/v1/management',
        users: '/users',
        disable: '/disable'
    },
    delivery: {
      base: '/delivery',
        view: '/view',
        create: '/create',
        updateClient: '/clients/{id}'
    },
    product: {
     base: '/products',
        toClient: '/toClient'
    },
    clients: {
      base: '/delivery',
      clients : '/clients'
    }
  }
}; 