import { Trans, useTranslation } from 'react-i18next';
import i18n from 'i18next';
import {keys, key1, suffix, fallbackKey, isAdmin} from './constants';
const dynamicKey = 'not.static.key';
const section = 'profile';

export const I18nUsageSample = () => {
  const { t } = useTranslation();
  const keyFromConst = 'profile.title';
  const keyPrefix = 'concat';
  const nsName = 'admin';

  const values = [t('auth.login.title'),
    t('dashboard.cards.total'),
    t(keyFromConst),
    ...keys.map(k => t(`settings.${k.key}`)),
    t(`user.${key1}`),
    t(`page.${suffix}`),
    t(keyPrefix + '.button'),
    t(isAdmin ? 'role.admin' : 'role.user'),
    t(['fallback.primary', fallbackKey]),
    t('panel.title', { ns: nsName }),
    t('item', { count: 2, context: 'male' }),
    i18n.t('menu.settings'),
    i18n.t(`errors.${section}.required`),
    <Trans i18nKey="common.save" />,
    <Trans i18nKey={'common.cancel'} />,
    <Trans i18nKey={`trans.${section}`} />,
    <Trans i18nKey={dynamicKey} />,
  ];
  console.log(values);

  return <>{values.length}</>;
};
