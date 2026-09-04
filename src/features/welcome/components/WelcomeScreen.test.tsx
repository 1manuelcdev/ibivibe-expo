import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';

const push = vi.hoisted(() => vi.fn());

vi.mock('expo-router', () => ({
  useRouter: () => ({ push }),
}));

import { WelcomeScreen } from '@/features/welcome/components/WelcomeScreen';

describe('WelcomeScreen', () => {
  it('shows the app proposition and routes users to sign in', async () => {
    await render(<WelcomeScreen />);

    expect(screen.getByText('Onde é hoje?')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(push).toHaveBeenCalledWith('/(auth)/login');
  });
});
