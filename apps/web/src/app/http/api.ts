import ky from 'ky';
import { toast } from 'sonner';

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        const { cookies } = await import('next/headers');
        // For server-side requests (SSR), read token from httpOnly cookie
        if (typeof window === 'undefined') {
          const cookieStore = await cookies();
          const token = cookieStore.get('token')?.value;

          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        } else {
          // For client-side requests, read token from accessible cookie
          const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('token-client='))
            ?.split('=')[1];

          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // Only handle errors on client side
        if (typeof window === 'undefined') {
          return;
        }

        // Check if response is an error
        if (!response.ok) {
          let errorMessage = 'Ocorreu um erro inesperado';

          try {
            // Try to extract error message from response body
            const errorData = (await response.json()) as { message?: string; error?: string };
            errorMessage = errorData.message || errorData.error || errorMessage;

            // Handle "Organization not found" specifically
            if (response.status === 404 && errorMessage === 'Organization not found') {
              // Call server-side logout to clear cookies
              await ky.post('/api/auth/logout');

              // Force redirect to sign-in
              window.location.href = '/auth/sign-in';
              return;
            }
          } catch {
            // If parsing fails, use status-based messages
            switch (response.status) {
              case 401:
                errorMessage = 'Não autorizado. Faça login novamente';
                break;
              case 403:
                errorMessage = 'Acesso negado';
                break;
              case 404:
                errorMessage = 'Recurso não encontrado';
                break;
              case 409:
                errorMessage = 'Conflito de dados';
                break;
              case 422:
                errorMessage = 'Dados inválidos';
                break;
              case 500:
                errorMessage = 'Erro interno do servidor';
                break;
              case 503:
                errorMessage = 'Serviço indisponível';
                break;
            }
          }

          // Show error toast (defer to avoid hydration issues)
          setTimeout(() => {
            toast.error(errorMessage);
          }, 100);
        }
      },
    ],
  },
});
