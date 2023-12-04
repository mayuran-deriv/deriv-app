import React, { ComponentProps, InputHTMLAttributes, lazy, Suspense } from 'react';
import { HelperMessageProps } from '../WalletTextField/HelperMessage';
import { WalletTextFieldProps } from '../WalletTextField/WalletTextField';

export interface WalletPasswordFieldProps extends WalletTextFieldProps {
    password: string;
    shouldDisablePasswordMeter?: boolean;
}

const WalletPasswordFieldLazyContainer = lazy(
    () => import('./WalletPasswordField')
) as React.FC<WalletPasswordFieldProps>;

const WalletPasswordFieldLazy: React.FC<WalletPasswordFieldProps> = props => (
    <Suspense fallback={<div>...loading</div>}>
        <WalletPasswordFieldLazyContainer {...props} />
    </Suspense>
);

export default WalletPasswordFieldLazy;
