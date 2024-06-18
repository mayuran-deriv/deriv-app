import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasskeyCard } from '../passkey-card';
import { mock_passkeys_list } from '../../__tests__/passkeys.spec';

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getOSNameWithUAParser: () => 'test OS',
}));

describe('PasskeyCard', () => {
    const mockOnPasskeyMenuClick = jest.fn();
    const mock_card = mock_passkeys_list[0];

    it('renders the passkey card correctly and trigger menu with renaming', () => {
        render(<PasskeyCard {...mock_card} onPasskeyMenuClick={mockOnPasskeyMenuClick} />);

        expect(screen.getByText(/test passkey/i)).toBeInTheDocument();
        expect(screen.getByText(/stored on/i)).toBeInTheDocument();
        expect(screen.getByText(/last used/i)).toBeInTheDocument();
        expect(screen.queryByText('Rename')).not.toBeInTheDocument();
        const menu_button = screen.getByTestId('dt_dropdown_display');
        userEvent.click(menu_button);
        const rename_option = screen.getByText('Rename');
        expect(rename_option).toBeInTheDocument();
        userEvent.click(rename_option);
        expect(mockOnPasskeyMenuClick).toHaveBeenCalledTimes(1);
    });
});
