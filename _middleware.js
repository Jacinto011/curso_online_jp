import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  
  // ⬇️ **IMPORTANTE: Mantenha o acesso à API livre**
  // Isso resolve os problemas de requisições OPTIONS
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // ⬇️ Adicione headers CORS APENAS para API em produção também
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', '*'); // Ou seu domínio específico
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    
    return response;
  }
  
  // Restante do seu middleware permanece igual...
  const publicPaths = ['/auth/login', '/auth/register', '/'];
  const isPublicPath = publicPaths.includes(pathname);

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      
      if (!decoded && !isPublicPath) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('token');
        return response;
      }

      if (pathname === '/auth/login' && decoded) {
        switch (decoded.role) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin', request.url));
          case 'instructor':
            return NextResponse.redirect(new URL('/instructor', request.url));
          default:
            return NextResponse.redirect(new URL('/student', request.url));
        }
      }

    } catch (error) {
      console.error('Erro no middleware:', error);
      
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // ⬇️ Agora inclui APIs mas com headers CORS
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};