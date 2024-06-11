import React from 'react';
import classNames from 'classnames';
import { observer, useStore } from '@deriv/stores';
import { Icon } from '@deriv/components';
import { getAllowedLanguages, useTranslations } from '@deriv-com/translations';
import { UNSUPPORTED_LANGUAGES } from '@deriv/shared';

export type TLanguageLink = {
    icon_classname?: string;
    is_clickable?: boolean;
    lang: string;
    toggleModal?: () => void;
};

const LanguageLink = observer(({ icon_classname, is_clickable = false, lang, toggleModal }: TLanguageLink) => {
    const { common } = useStore();
    const { currentLang, switchLanguage } = useTranslations();
    const { changeSelectedLanguage } = common;
    const is_active = currentLang === lang;

    const link: React.ReactNode = (
        <React.Fragment>
            <Icon
                icon={`IcFlag${lang.replace('_', '-')}`}
                className={classNames(
                    'settings-language__language-link-flag',
                    'settings-language__language-flag',
                    icon_classname
                )}
            />
            <span
                className={classNames('settings-language__language-name', {
                    'settings-language__language-name--active': is_active,
                })}
            >
                {getAllowedLanguages(UNSUPPORTED_LANGUAGES)[lang]}
            </span>
        </React.Fragment>
    );
    return (
        <React.Fragment>
            {!is_clickable ? (
                <div
                    id={`dt_settings_${lang}_button`}
                    className={classNames('settings-language__language-link', {
                        'settings-language__language-link--active': is_active,
                    })}
                >
                    {link}
                </div>
            ) : (
                <span
                    data-testid='dt_settings_language_button'
                    id={`dt_settings_${lang}_button`}
                    key={lang}
                    onClick={() => {
                        changeSelectedLanguage(lang);
                        switchLanguage(lang);
                        toggleModal?.();
                    }}
                    className={classNames('settings-language__language-link', {
                        'settings-language__language-link--active': is_active,
                    })}
                >
                    {link}
                </span>
            )}
        </React.Fragment>
    );
});

export default LanguageLink;
