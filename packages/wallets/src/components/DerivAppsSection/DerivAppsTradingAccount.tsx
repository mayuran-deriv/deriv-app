import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
    useActiveLinkedToTradingAccount,
    useActiveWalletAccount,
    useBalanceSubscription,
    useBalance,
    useAuthorize,
} from '@deriv/api-v2';
import { LabelPairedArrowsRotateSmBoldIcon, LabelPairedArrowUpArrowDownSmBoldIcon } from '@deriv/quill-icons';
import useDevice from '../../hooks/useDevice';
import { WalletText } from '../Base';
import { WalletListCardBadge } from '../WalletListCardBadge';
import { WalletMarketIcon } from '../WalletMarketIcon';
import { displayMoney } from '@deriv/api-v2/src/utils';

const DerivAppsTradingAccount: React.FC = () => {
    const { isMobile } = useDevice();
    const history = useHistory();
    const { isLoading } = useBalance();
    const { data: activeWallet } = useActiveWalletAccount();
    const { data: activeLinkedToTradingAccount } = useActiveLinkedToTradingAccount();
    const { data: balanceData, subscribe, unsubscribe } = useBalanceSubscription();
    const { data: authData } = useAuthorize();

    useEffect(() => {
        if (activeLinkedToTradingAccount) {
            subscribe({
                account: activeLinkedToTradingAccount.loginid,
            });
        }

        return () => {
            unsubscribe();
        };
    }, [activeLinkedToTradingAccount, subscribe]);

    const linkedAccountCurrencyCode = activeLinkedToTradingAccount?.currency_config?.display_code;
    const linkedAccountPreferredLanguage = authData?.preferred_language;
    let linkedAccountFormattedBalance = '';

    if (
        balanceData &&
        typeof balanceData?.balance === 'number' &&
        linkedAccountCurrencyCode &&
        linkedAccountPreferredLanguage
    ) {
        linkedAccountFormattedBalance = displayMoney(balanceData?.balance, linkedAccountCurrencyCode, {
            fractional_digits: activeLinkedToTradingAccount?.currency_config?.fractional_digits,
            preferred_language: linkedAccountPreferredLanguage,
        });
    }

    return (
        <div className='wallets-deriv-apps-section wallets-deriv-apps-section__border'>
            <div className={isMobile ? 'wallets-deriv-apps-section__icon-small' : 'wallets-deriv-apps-section__icon'}>
                <WalletMarketIcon icon='IcWalletOptionsLight' size={isMobile ? 'md' : 'lg'} />
            </div>
            <div className='wallets-deriv-apps-section__details'>
                <div className='wallets-deriv-apps-section__title-and-badge'>
                    <WalletText size='sm'>Options</WalletText>
                    <WalletListCardBadge isDemo={activeWallet?.is_virtual} label={activeWallet?.landing_company_name} />
                </div>
                {isLoading ? (
                    <div className='wallets-skeleton wallets-deriv-apps-balance-loader' />
                ) : (
                    <WalletText size='sm' weight='bold'>
                        {linkedAccountFormattedBalance}
                    </WalletText>
                )}
                <WalletText color='less-prominent' lineHeight='sm' size='xs' weight='bold'>
                    {activeLinkedToTradingAccount?.loginid}
                </WalletText>
            </div>
            <button
                className='wallets-deriv-apps-section__button'
                onClick={() => {
                    activeWallet?.is_virtual
                        ? history.push('/wallet/reset-balance')
                        : history.push('/wallet/account-transfer', {
                              toAccountLoginId: activeLinkedToTradingAccount?.loginid,
                          });
                }}
            >
                {activeWallet?.is_virtual ? (
                    <LabelPairedArrowsRotateSmBoldIcon />
                ) : (
                    <LabelPairedArrowUpArrowDownSmBoldIcon />
                )}
            </button>
        </div>
    );
};

export { DerivAppsTradingAccount };
