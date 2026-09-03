import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.'),
    display_name: z.string().trim().min(2, 'Informe o nome de exibição.'),
    slug: z
      .string()
      .trim()
      .min(4, 'Use pelo menos 4 caracteres.')
      .regex(/^[a-z0-9-]+$/, 'Use letras minúsculas, números e hífen.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    password_confirm: z.string(),
    type: z.enum(['personal', 'business']),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: 'As senhas precisam ser iguais.',
    path: ['password_confirm'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
