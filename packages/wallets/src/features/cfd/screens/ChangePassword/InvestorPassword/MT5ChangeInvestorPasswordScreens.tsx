import React, { useState } from 'react';
import { SentEmailContent } from '../../../../../components';
import { useModal } from '../../../../../components/ModalProvider';
import MT5ChangeInvestorPasswordInputsScreen from './MT5ChangeInvestorPasswordInputsScreen';
import MT5ChangeInvestorPasswordSavedScreen from './MT5ChangeInvestorPasswordSavedScreen';
import './MT5ChangeInvestorPasswordScreens.scss';

type TChangeInvestorPasswordScreenIndex = 'emailVerification' | 'introScreen' | 'savedScreen';

const MT5ChangeInvestorPasswordScreens = () => {
    const [activeScreen, setActiveScreen] = useState<TChangeInvestorPasswordScreenIndex>('introScreen');
    const handleClick = (nextScreen: TChangeInvestorPasswordScreenIndex) => setActiveScreen(nextScreen);
    const { hide } = useModal();

    return (
        <div className='wallets-change-investor-password-screens__content'>
            <MT5ChangeInvestorPasswordInputsScreen
                sendEmail={() => handleClick('emailVerification')}
                setNextScreen={() => handleClick('savedScreen')}
            />
        </div>
    );
};

export default MT5ChangeInvestorPasswordScreens;
