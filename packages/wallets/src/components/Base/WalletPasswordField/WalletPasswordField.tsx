import React, { useCallback, useState } from 'react';
import { Score, calculateScore, validPassword, isPasswordValid, passwordKeys } from '../../../utils/password';
import { WalletTextField } from '../WalletTextField';
import { WalletTextFieldProps } from '../WalletTextField/WalletTextField';
import PasswordMeter from './PasswordMeter';
import PasswordViewerIcon from './PasswordViewerIcon';
import './WalletPasswordField.scss';
import { passwordErrorMessage, passwordRegex, warningMessages } from '../../../constants/password';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import { dictionary } from '@zxcvbn-ts/language-common';

interface WalletPasswordFieldProps extends WalletTextFieldProps {
    password: string;
    shouldDisablePasswordMeter?: boolean;
}

export const validatePassword = (password: string) => {
    const score = calculateScore(password);
    let errorMessage = '';

    const options = { dictionary: { ...dictionary } };
    zxcvbnOptions.setOptions(options);

    const { feedback } = zxcvbn(password);
    if (!passwordRegex.isLengthValid.test(password)) {
        errorMessage = passwordErrorMessage.invalidLength;
    } else if (!isPasswordValid(password)) {
        errorMessage = passwordErrorMessage.missingCharacter;
    } else {
        errorMessage = warningMessages[feedback.warning as passwordKeys] || '';
    }
    return { errorMessage, score };
};

const WalletPasswordField: React.FC<WalletPasswordFieldProps> = ({
    autoComplete,
    label,
    name = 'walletPasswordField',
    onChange,
    password,
    shouldDisablePasswordMeter = false,
    showMessage,
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    const { errorMessage, score } = validatePassword(password);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e);
            setIsTouched(true);
        },
        [onChange]
    );

    return (
        <div className='wallets-password'>
            <WalletTextField
                autoComplete={autoComplete}
                errorMessage={errorMessage}
                isInvalid={!validPassword(password) && isTouched}
                label={label}
                message={isTouched ? errorMessage : ''}
                messageVariant='warning'
                name={name}
                onChange={handleChange}
                renderRightIcon={() => (
                    <PasswordViewerIcon setViewPassword={setIsPasswordVisible} viewPassword={isPasswordVisible} />
                )}
                showMessage={showMessage}
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
            />
            {!shouldDisablePasswordMeter && <PasswordMeter score={score as Score} />}
        </div>
    );
};

export default WalletPasswordField;
