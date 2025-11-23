import ky from 'ky';
import { toast } from 'sonner';

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        if (typeof window === 'undefined') {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const token = cookieStore.get('token')?.value;
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
