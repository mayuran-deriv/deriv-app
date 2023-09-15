import React from 'react';
import { APIProvider, useCurrencyConfig } from '@deriv/api';
import { screen, render } from '@testing-library/react';
import { StoreProvider, mockStore } from '@deriv/stores';
import AddWalletCard from '../wallet-add-card';

const wallet_info = {
    currency: 'BTC',
    gradient_card_class: '',
    landing_company_name: 'svg',
    is_added: false,
};

const mockUseCurrencyConfig = useCurrencyConfig as jest.MockedFunction<typeof useCurrencyConfig>;

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useCurrencyConfig: jest.fn(),
    useFetch: jest.fn((name: string) => {
        if (name === 'authorize') {
            return {
                data: {
                    authorize: {
                        account_list: [
                            { account_category: 'wallet', landing_company_name: 'svg', is_virtual: 0, currency: 'USD' },
                        ],
                        landing_company_name: 'svg',
                    },
                },
            };
        }

        if (name === 'get_account_types') {
            return {
                data: {
                    get_account_types: {
                        wallet: {
                            crypto: {
                                currencies: ['BTC'],
                            },
                            doughflow: {
                                currencies: ['USD'],
                            },
                        },
                    },
                },
            };
        }

        return { data: undefined };
    }),
}));

describe('AddWalletCard', () => {
    it('should render currency card', () => {
        const mock = mockStore({});

        mockUseCurrencyConfig.mockReturnValue({
            // @ts-expect-error need to come up with a way to mock the return type of useCurrencyConfig
            getConfig: () => ({ display_code: 'BTC', type: 'crypto', name: 'Bitcoin' }),
        });

        render(
            <StoreProvider store={mock}>
                <APIProvider>
                    <AddWalletCard wallet_info={{ ...wallet_info }} />
                </APIProvider>
            </StoreProvider>
        );

        const add_btn = screen.getByRole('button', { name: /Add/i });
        expect(screen.getByText('BTC Wallet')).toBeInTheDocument();
        expect(screen.getByText('SVG')).toBeInTheDocument();
        expect(add_btn).toBeInTheDocument();
        expect(add_btn).toBeEnabled();
        expect(
            screen.getByText(
                "Deposit and withdraw Bitcoin, the world's most popular cryptocurrency, hosted on the Bitcoin blockchain."
            )
        ).toBeInTheDocument();
    });

    it('should disabled button when it is disabled', () => {
        const mock = mockStore({});

        render(
            <StoreProvider store={mock}>
                <APIProvider>
                    <AddWalletCard wallet_info={{ ...wallet_info, is_added: true }} />
                </APIProvider>
            </StoreProvider>
        );

        const added_btn = screen.getByRole('button', { name: /Added/i });
        expect(added_btn).toBeInTheDocument();
        expect(added_btn).toBeDisabled();
    });

    it('should show USDT instead of UST for UST currency', () => {
        const mock = mockStore({});

        mockUseCurrencyConfig.mockReturnValue({
            // @ts-expect-error need to come up with a way to mock the return type of useCurrencyConfig
            getConfig: () => ({ display_code: 'USDT', type: 'crypto', name: 'USDT' }),
        });

        render(
            <StoreProvider store={mock}>
                <APIProvider>
                    <AddWalletCard wallet_info={{ ...wallet_info, currency: 'UST' }} />
                </APIProvider>
            </StoreProvider>
        );
        expect(screen.getByText('USDT Wallet')).toBeInTheDocument();
        expect(screen.queryByText('UST Wallet')).not.toBeInTheDocument();
    });
});
