import React from 'react';
import { useActiveWalletAccount } from '@deriv/api';
import { WalletButton, WalletText } from '../../../../components/Base';
import useDevice from '../../../../hooks/useDevice';
import { TMarketTypes, TPlatforms } from '../../../../types';
import { validPassword } from '../../../../utils/password';
import { MarketTypeDetails, PlatformDetails } from '../../constants';
import './EnterPassword.scss';
import WalletPasswordFieldLazy from '../../../../components/Base/WalletPasswordField/WalletPasswordFieldLazy';

type TProps = {
    isLoading?: boolean;
    marketType: TMarketTypes.CreateOtherCFDAccount;
    onPasswordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
    password: string;
    platform: TPlatforms.All;
};

const EnterPassword: React.FC<TProps> = ({
    isLoading,
    marketType,
    onPasswordChange,
    onPrimaryClick,
    onSecondaryClick,
    password,
    platform,
}) => {
    const { isDesktop } = useDevice();
    const title = PlatformDetails[platform].title;
    const { data } = useActiveWalletAccount();
    const accountType = data?.is_virtual ? 'Demo' : 'Real';
    const marketTypeTitle =
        platform === PlatformDetails.dxtrade.platform ? accountType : MarketTypeDetails[marketType].title;

    return (
        <div className='wallets-enter-password'>
            <div className='wallets-enter-password__container'>
                <WalletText lineHeight='xl' weight='bold'>
                    Enter your {title} password
                </WalletText>
                <WalletText size='sm'>
                    Enter your {title} password to add a {title} {marketTypeTitle} account.
                </WalletText>
                <WalletPasswordFieldLazy
                    label={`${title} password`}
                    onChange={onPasswordChange}
                    password={password}
                    shouldDisablePasswordMeter
                    showMessage={false}
                />
            </div>
            {isDesktop && (
                <div className='wallets-enter-password__buttons'>
                    <WalletButton onClick={onSecondaryClick} size='lg' text='Forgot password?' variant='outlined' />
                    <WalletButton
                        disabled={!password || isLoading || !validPassword(password)}
                        isLoading={isLoading}
                        onClick={onPrimaryClick}
                        size='lg'
                        text='Add account'
                    />
                </div>
            )}
        </div>
    );
};

export default EnterPassword;
