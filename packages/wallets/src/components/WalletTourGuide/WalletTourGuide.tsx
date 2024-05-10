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
    walletsOnboardingStartValue as START_VALUE,
} from './WalletTourGuideSettings';
import './WalletTourGuide.scss';

/**
 * to start tour, we need to synchronise multiple sources of data
 * some of them are event/promise driven like switchAccount()
 * some of them are side-effect drive (like observing changes in local storage or observing loading states)
 * pretty hard to make sense out of all of them, so in order to keep track whats going on, added that small state machine
 * which is effectively driving behaviour of the tour based on specific signals
 * makes it massively easier to really wait for everything we need to wait for
 */
const TOUR_STATES = {
    UNKNOWN: '',
    REQUESTED: 'requested',
    SWITCHING_WALLET: 'switching_wallet',
    READY_TO_PLAY: 'ready_to_play',
};

const WalletTourGuide = () => {
    const [walletsOnboarding, setWalletsOnboarding] = useLocalStorage(key, useReadLocalStorage(key) ?? '');
    const [addMoreWalletsTransformValue, setAddMoreWalletsTransformValue] = useState('');
    const { isMobile } = useDevice();

    // just because someone clicked button in dtrader and set local storage
    // does not mean we should run the tour as we might need to wait for the account to be switched
    const [run, setRun] = useState(false);

    const switchWalletAccount = useWalletAccountSwitcher();
    const { isFetching, isLoading, isSuccess, isSwitching } = useAuthorize();
    const { data: wallets } = useWalletAccountsList();
    const { data: activeWallet } = useActiveWalletAccount();
    const { data: availableWallets } = useAllWalletAccounts();

    const { isLoading: ctraderIsLoading } = useCtraderAccountsList();
    const { isLoading: dxtradeIsLoading } = useDxtradeAccountsList();
    const { isLoading: sorteAccountsListLoading } = useSortedMT5Accounts();

    const addMoreWalletRef = useRef<HTMLElement | null>(document.getElementById('wallets_add_more_carousel_wrapper'));
    const tourGuideStateRef = useRef(TOUR_STATES.UNKNOWN);

    const fiatWalletLoginId = getFiatWalletLoginId(wallets);
    const walletIndex = getWalletIndexForTarget(fiatWalletLoginId, wallets);
    const activeWalletLoginId = activeWallet?.loginid;

    const isDemoWallet = Boolean(activeWallet?.is_virtual);
    const hasMT5Account = Boolean(
        activeWallet?.linked_to?.some(account => account.platform === PlatformDetails.mt5.platform)
    );
    const hasDerivAppsTradingAccount = Boolean(activeWallet?.dtrade_loginid);
    const isAllWalletsAlreadyAdded = Boolean(availableWallets?.every(wallet => wallet.is_added));

    const isAnythingLoading =
        dxtradeIsLoading || ctraderIsLoading || isFetching || !isSuccess || isLoading || sorteAccountsListLoading;

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

    // that effect is there only to establish if we even want to start the tour
    useEffect(() => {
        const startRequested = walletsOnboarding === START_VALUE;

        // do nothing if we don't need to start
        if (!startRequested) {
            return;
        }

        // if we are in the middle of something, just reject the start request,
        // its acceptable UI for the button to not work while app is loading
        if (isAnythingLoading) {
            return;
        }

        // we established that we need to start and nothing is loading, so we can start
        // and clean the loacl storage so we don't start again
        tourGuideStateRef.current = TOUR_STATES.REQUESTED;
        setRun(false);
        setWalletsOnboarding('');
    }, [walletsOnboarding, isAnythingLoading]);

    // that effect is there to handle the account switching
    useEffect(() => {
        // do nothing if we haven't requested the start
        if (tourGuideStateRef.current !== TOUR_STATES.REQUESTED) {
            return;
        }

        // check if we need to switch the account
        if (fiatWalletLoginId && fiatWalletLoginId !== activeWalletLoginId) {
            tourGuideStateRef.current = TOUR_STATES.SWITCHING_WALLET;
            switchWalletAccount(fiatWalletLoginId).then(() => {
                // once wallet is switched, we just wait for stuff to be loaded
                tourGuideStateRef.current = TOUR_STATES.READY_TO_PLAY;
            });
        } else {
            // no need to switch wallet, we can go straight to loading
            tourGuideStateRef.current = TOUR_STATES.READY_TO_PLAY;
        }
    }, [activeWalletLoginId, fiatWalletLoginId, tourGuideStateRef.current, switchWalletAccount]);

    // that effect is there to actually start the tour once everything is loaded
    useEffect(() => {
        // do nothing if we are not in loading state
        if (tourGuideStateRef.current !== TOUR_STATES.READY_TO_PLAY) {
            return;
        }

        // we are ready to play, so we can start the tour
        if (!isAnythingLoading) {
            setRun(true);
            tourGuideStateRef.current = TOUR_STATES.UNKNOWN;
            setWalletsOnboarding('');
        }
    }, [isAnythingLoading, tourGuideStateRef.current]);

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
            run={run}
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
