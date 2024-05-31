import React from 'react';
import { APIProvider, useBalanceSubscription } from '@deriv/api-v2';
import { act, render, screen } from '@testing-library/react';
import WalletsAuthProvider from '../../../AuthProvider';
import { DerivAppsTradingAccount } from '../DerivAppsTradingAccount';

jest.mock('@deriv/api-v2', () => ({
    ...jest.requireActual('@deriv/api-v2'),
    useBalanceSubscription: jest.fn(() => ({
        data: {
            balance: 100,
        },
        isLoading: false,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
    })),
    useActiveLinkedToTradingAccount: jest.fn(() => ({
        data: {
            loginid: '12345',
            currency_config: {
                display_code: 'USD',
                fractional_digits: 2,
            },
        },
    })),
    useAuthorize: jest.fn(() => ({
        data: {
            preferred_language: 'en',
        },
    })),
}));

const wrapper = () => (
    <APIProvider>
        <WalletsAuthProvider>
            <DerivAppsTradingAccount />
        </WalletsAuthProvider>
    </APIProvider>
);

describe('DerivAppsTradingAccount', () => {
    it('should render', () => {
        render(<DerivAppsTradingAccount />, { wrapper });
        expect(screen.getByTestId('dt_apps_trading_account')).toBeInTheDocument();
    });

    it('should display balance', () => {
        render(<DerivAppsTradingAccount />, { wrapper });
        expect(screen.getByTestId('dt_apps_trading_account_balance')).toBeInTheDocument();
        expect(screen.getByTestId('dt_apps_trading_account_balance')).toHaveTextContent('100.00 USD');
    });

    it('should unsubscribe when component unmounts', () => {
        const mockUnsubscribe = jest.fn();
        (useBalanceSubscription as jest.Mock).mockReturnValue({
            data: {
                balance: 100,
            },
            isLoading: false,
            subscribe: jest.fn(),
            unsubscribe: mockUnsubscribe,
        });
        const { unmount } = render(<DerivAppsTradingAccount />, { wrapper });

        act(() => {
            unmount();
        });

        expect(mockUnsubscribe).toBeCalled();
    });
});
