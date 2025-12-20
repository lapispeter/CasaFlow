import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStr = localStorage.getItem('auth');

  if (!authStr) {
    return next(req);
  }

  let token: string | null = null;

  try {
    const parsed = JSON.parse(authStr);
    token = parsed?.accessToken ?? null;
  } catch {
    token = null;
  }

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
