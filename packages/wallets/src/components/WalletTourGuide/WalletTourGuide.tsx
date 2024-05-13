import React, { useEffect, useRef, useState } from 'react';
import { useLocalStorage, useReadLocalStorage } from 'usehooks-ts';
import {
    useActiveWalletAccount,
    useAllWalletAccounts,
    useAuthorize,
    useWalletAccountsList,
    useCtraderAccountsList,
    useDxtradeAccountsList,
    useSortedMT5Accounts,
} from '@deriv/api-v2';
import Joyride, { ACTIONS, CallBackProps } from '@deriv/react-joyride';
import { PlatformDetails } from '../../features/cfd/constants';
import useDevice from '../../hooks/useDevice';
import useWalletAccountSwitcher from '../../hooks/useWalletAccountSwitcher';
import {
    getFiatWalletLoginId,
    getWalletIndexForTarget,
    TooltipComponent,
    tourStepConfig,
    walletsOnboardingLocalStorageKey as key,
    walletsOnboardingStartValue as startValue,
} from './WalletTourGuideSettings';
import './WalletTourGuide.scss';

const WalletTourGuide = () => {
    const [walletsOnboarding, setWalletsOnboarding] = useLocalStorage(key, useReadLocalStorage(key) ?? '');
    const [run, setRun] = useState(false);

    const [addMoreWalletsTransformValue, setAddMoreWalletsTransformValue] = useState('');
    const { isMobile } = useDevice();

    const switchWalletAccount = useWalletAccountSwitcher();
    const { isFetching, isLoading, isSuccess } = useAuthorize();
    const { data: wallets } = useWalletAccountsList();
    const { data: activeWallet } = useActiveWalletAccount();
    const { data: availableWallets } = useAllWalletAccounts();
    const { isLoading: ctraderIsLoading } = useCtraderAccountsList();
    const { isLoading: dxtradeIsLoading } = useDxtradeAccountsList();
    const { isLoading: sortedAccountsListLoading } = useSortedMT5Accounts();

    const isEverytingLoaded =
        !isLoading && !isFetching && isSuccess && !ctraderIsLoading && !dxtradeIsLoading && !sortedAccountsListLoading;

    const addMoreWalletRef = useRef<HTMLElement | null>(document.getElementById('wallets_add_more_carousel_wrapper'));

    const fiatWalletLoginId = getFiatWalletLoginId(wallets);
    const walletIndex = getWalletIndexForTarget(fiatWalletLoginId, wallets);
    const activeWalletLoginId = activeWallet?.loginid;

    const isDemoWallet = Boolean(activeWallet?.is_virtual);
    const hasMT5Account = Boolean(
        activeWallet?.linked_to?.some(account => account.platform === PlatformDetails.mt5.platform)
    );
    const hasDerivAppsTradingAccount = Boolean(activeWallet?.dtrade_loginid);
    const isAllWalletsAlreadyAdded = Boolean(availableWallets?.every(wallet => wallet.is_added));

    const callbackHandle = (data: CallBackProps) => {
        const { action, index, lifecycle } = data;

        if (index === 0 && !isAllWalletsAlreadyAdded) {
            if (addMoreWalletRef.current && lifecycle === 'init' && action === 'start') {
                setAddMoreWalletsTransformValue(addMoreWalletRef.current.style.transform);
                addMoreWalletRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
            }
        }

        if (action === ACTIONS.RESET) {
            setWalletsOnboarding('');
            setRun(false);
            if (!isAllWalletsAlreadyAdded && addMoreWalletRef.current) {
                addMoreWalletRef.current.style.transform = addMoreWalletsTransformValue;
            }
        }
    };

    useEffect(() => {
        const switchToFiatWallet = () => {
            if (fiatWalletLoginId && fiatWalletLoginId !== activeWalletLoginId) {
                switchWalletAccount(fiatWalletLoginId);
            }
        };

        const needToStart = walletsOnboarding === startValue;
        if (needToStart) {
            setRun(true);
            switchToFiatWallet();
        }
    }, [activeWalletLoginId, fiatWalletLoginId, switchWalletAccount, walletsOnboarding]);

    useEffect(() => {
        if (!addMoreWalletRef.current) {
            addMoreWalletRef.current = document.getElementById('wallets_add_more_carousel_wrapper');
        }
    }, []);

    if (isMobile) return null;

    return (
        <Joyride
            callback={callbackHandle}
            continuous
            disableCloseOnEsc
            disableOverlayClose
            floaterProps={{ disableAnimation: true }}
            run={run && fiatWalletLoginId == activeWalletLoginId && isEverytingLoaded}
            scrollDuration={0}
            scrollOffset={150}
            steps={tourStepConfig(
                false,
                isDemoWallet,
                hasMT5Account,
                hasDerivAppsTradingAccount,
                isAllWalletsAlreadyAdded,
                walletIndex
            )}
            tooltipComponent={TooltipComponent}
        />
    );
};

export default WalletTourGuide;
