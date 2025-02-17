import { useCallback, useMemo } from 'react';
import { sprintf } from 'sprintf-js';
import styled from 'styled-components';

import { strings } from '../../config.json';
import { IDnsOptions, TunnelProtocol } from '../../shared/daemon-rpc-types';
import { messages } from '../../shared/gettext';
import log from '../../shared/logging';
import RelaySettingsBuilder from '../../shared/relay-settings-builder';
import { useAppContext } from '../context';
import { useHistory } from '../lib/history';
import { RoutePath } from '../lib/routes';
import { useBoolean } from '../lib/utilityHooks';
import { formatMarkdown } from '../markdown-formatter';
import { RelaySettingsRedux } from '../redux/settings/reducers';
import { useSelector } from '../redux/store';
import * as AppButton from './AppButton';
import { AriaDescription, AriaDetails, AriaInput, AriaInputGroup, AriaLabel } from './AriaGroup';
import * as Cell from './cell';
import Selector, { ISelectorItem } from './cell/Selector';
import CustomDnsSettings from './CustomDnsSettings';
import InfoButton, { InfoIcon } from './InfoButton';
import { BackAction } from './KeyboardNavigation';
import { Layout, SettingsContainer } from './Layout';
import { ModalAlert, ModalAlertType, ModalMessage } from './Modal';
import {
  NavigationBar,
  NavigationContainer,
  NavigationItems,
  NavigationScrollbars,
  TitleBarItem,
} from './NavigationBar';
import SettingsHeader, { HeaderTitle } from './SettingsHeader';

const StyledContent = styled.div({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  marginBottom: '2px',
});

const StyledInfoIcon = styled(InfoIcon)({
  marginRight: '16px',
});

const StyledSelectorContainer = styled.div({
  flex: 0,
});

export default function VpnSettings() {
  const { pop } = useHistory();

  return (
    <BackAction action={pop}>
      <Layout>
        <SettingsContainer>
          <NavigationContainer>
            <NavigationBar>
              <NavigationItems>
                <TitleBarItem>
                  {
                    // TRANSLATORS: Title label in navigation bar
                    messages.pgettext('vpn-settings-view', 'VPN settings')
                  }
                </TitleBarItem>
              </NavigationItems>
            </NavigationBar>

            <NavigationScrollbars>
              <SettingsHeader>
                <HeaderTitle>{messages.pgettext('vpn-settings-view', 'VPN settings')}</HeaderTitle>
              </SettingsHeader>

              <StyledContent>
                <Cell.Group>
                  <AutoStart />
                  <AutoConnect />
                </Cell.Group>

                <Cell.Group>
                  <AllowLan />
                </Cell.Group>

                <Cell.Group>
                  <BlockAds />
                  <BlockTrackers />
                  <BlockMalware />
                  <BlockGambling />
                  <BlockAdultContent />
                </Cell.Group>

                <Cell.Group>
                  <EnableIpv6 />
                </Cell.Group>

                <Cell.Group>
                  <KillSwitchInfo />
                  <LockdownMode />
                </Cell.Group>

                <Cell.Group>
                  <TunnelProtocolSetting />
                </Cell.Group>

                <Cell.Group>
                  <WireguardSettingsButton />
                  <OpenVpnSettingsButton />
                </Cell.Group>

                <Cell.Group>
                  <CustomDnsSettings />
                </Cell.Group>
              </StyledContent>
            </NavigationScrollbars>
          </NavigationContainer>
        </SettingsContainer>
      </Layout>
    </BackAction>
  );
}

function AutoStart() {
  const autoStart = useSelector((state) => state.settings.autoStart);
  const { setAutoStart: setAutoStartImpl } = useAppContext();

  const setAutoStart = useCallback(
    async (autoStart: boolean) => {
      try {
        await setAutoStartImpl(autoStart);
      } catch (e) {
        const error = e as Error;
        log.error(`Cannot set auto-start: ${error.message}`);
      }
    },
    [setAutoStartImpl],
  );

  return (
    <AriaInputGroup>
      <Cell.Container>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Launch app on start-up')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaInput>
          <Cell.Switch isOn={autoStart} onChange={setAutoStart} />
        </AriaInput>
      </Cell.Container>
    </AriaInputGroup>
  );
}

function AutoConnect() {
  const autoConnect = useSelector((state) => state.settings.guiSettings.autoConnect);
  const { setAutoConnect } = useAppContext();

  return (
    <AriaInputGroup>
      <Cell.Container>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Auto-connect')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaInput>
          <Cell.Switch isOn={autoConnect} onChange={setAutoConnect} />
        </AriaInput>
      </Cell.Container>
      <Cell.Footer>
        <AriaDescription>
          <Cell.FooterText>
            {messages.pgettext(
              'vpn-settings-view',
              'Automatically connect to a server when the app launches.',
            )}
          </Cell.FooterText>
        </AriaDescription>
      </Cell.Footer>
    </AriaInputGroup>
  );
}

function AllowLan() {
  const allowLan = useSelector((state) => state.settings.allowLan);
  const { setAllowLan } = useAppContext();

  return (
    <AriaInputGroup>
      <Cell.Container>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Local network sharing')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaInput>
          <Cell.Switch isOn={allowLan} onChange={setAllowLan} />
        </AriaInput>
      </Cell.Container>
      <Cell.Footer>
        <AriaDescription>
          <Cell.FooterText>
            {messages.pgettext(
              'vpn-settings-view',
              'Allows access to other devices on the same network for sharing, printing etc.',
            )}
          </Cell.FooterText>
        </AriaDescription>
      </Cell.Footer>
    </AriaInputGroup>
  );
}

function useDns(setting: keyof IDnsOptions['defaultOptions']) {
  const dns = useSelector((state) => state.settings.dns);
  const { setDnsOptions } = useAppContext();

  const updateBlockSetting = useCallback(
    (enabled: boolean) =>
      setDnsOptions({
        ...dns,
        defaultOptions: {
          ...dns.defaultOptions,
          [setting]: enabled,
        },
      }),
    [dns, setDnsOptions],
  );

  return [dns, updateBlockSetting] as const;
}

function BlockAds() {
  const [dns, setBlockAds] = useDns('blockAds');

  return (
    <AriaInputGroup>
      <Cell.Container disabled={dns.state === 'custom'}>
        <AriaLabel>
          <Cell.InputLabel>{messages.pgettext('vpn-settings-view', 'Block ads')}</Cell.InputLabel>
        </AriaLabel>
        <AriaDetails>
          <InfoButton>
            <ModalMessage>
              {messages.pgettext(
                'vpn-settings-view',
                'When enabled, this feature stops the device from contacting certain known ad domains.',
              )}
            </ModalMessage>
            <ModalMessage>
              {messages.pgettext(
                'vpn-settings-view',
                'Warning: This might cause issues on certain websites, services, and programs.',
              )}
            </ModalMessage>
          </InfoButton>
        </AriaDetails>
        <AriaInput>
          <Cell.Switch
            isOn={dns.state === 'default' && dns.defaultOptions.blockAds}
            onChange={setBlockAds}
          />
        </AriaInput>
      </Cell.Container>
    </AriaInputGroup>
  );
}

function BlockTrackers() {
  const [dns, setBlockTrackers] = useDns('blockTrackers');

  return (
    <AriaInputGroup>
      <Cell.Container disabled={dns.state === 'custom'}>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Block trackers')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaDetails>
          <InfoButton>
            <ModalMessage>
              {messages.pgettext(
                'vpn-settings-view',
                'When enabled, this feature stops the device from contacting certain domains known to track users.',
              )}
            </ModalMessage>
            <ModalMessage>
              {messages.pgettext(
                'vpn-settings-view',
                'Warning: This might cause issues on certain websites, services, and programs.',
              )}
            </ModalMessage>
          </InfoButton>
        </AriaDetails>
        <AriaInput>
          <Cell.Switch
            isOn={dns.state === 'default' && dns.defaultOptions.blockTrackers}
            onChange={setBlockTrackers}
          />
        </AriaInput>
      </Cell.Container>
    </AriaInputGroup>
  );
}

function BlockMalware() {
  const [dns, setBlockMalware] = useDns('blockMalware');

  return (
    <AriaInputGroup>
      <Cell.Container disabled={dns.state === 'custom'}>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Block malware')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaDetails>
          <InfoButton>
            <ModalMessage>
              {messages.pgettext(
                'vpn-settings-view',
                'When enabled, this feature stops the device from contacting certain domains known to host malware.',
              )}
            </ModalMessage>
            <ModalMessage>
              {messages.pgettext(
                'vpn-settings-view',
                'Warning: This is not an anti-virus and should not be treated as such, this is just an extra layer of protection.',
              )}
            </ModalMessage>
          </InfoButton>
        </AriaDetails>
        <AriaInput>
          <Cell.Switch
            isOn={dns.state === 'default' && dns.defaultOptions.blockMalware}
            onChange={setBlockMalware}
          />
        </AriaInput>
      </Cell.Container>
    </AriaInputGroup>
  );
}

function BlockGambling() {
  const [dns, setBlockGambling] = useDns('blockGambling');

  return (
    <AriaInputGroup>
      <Cell.Container disabled={dns.state === 'custom'}>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Block gambling')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaDetails>
          <InfoButton
            message={messages.pgettext(
              'vpn-settings-view',
              'When enabled, this feature stops the device from contacting certain websites and services known to host gambling content.',
            )}
          />
        </AriaDetails>
        <AriaInput>
          <Cell.Switch
            isOn={dns.state === 'default' && dns.defaultOptions.blockGambling}
            onChange={setBlockGambling}
          />
        </AriaInput>
      </Cell.Container>
    </AriaInputGroup>
  );
}

function BlockAdultContent() {
  const [dns, setBlockAdultContent] = useDns('blockAdultContent');

  return (
    <AriaInputGroup>
      <Cell.Container disabled={dns.state === 'custom'}>
        <AriaLabel>
          <Cell.InputLabel>
            {messages.pgettext('vpn-settings-view', 'Block adult content')}
          </Cell.InputLabel>
        </AriaLabel>
        <AriaDetails>
          <InfoButton
            message={messages.pgettext(
              'vpn-settings-view',
              'When enabled, this feature stops the device from contacting certain websites and services known to host adult content.',
            )}
          />
        </AriaDetails>
        <AriaInput>
          <Cell.Switch
            isOn={dns.state === 'default' && dns.defaultOptions.blockAdultContent}
            onChange={setBlockAdultContent}
          />
        </AriaInput>
      </Cell.Container>
      {dns.state === 'custom' && <CustomDnsEnabledFooter />}
    </AriaInputGroup>
  );
}

function CustomDnsEnabledFooter() {
  const customDnsFeatureName = messages.pgettext('vpn-settings-view', 'Use custom DNS server');

  // TRANSLATORS: This is displayed when the custom DNS setting is turned on which makes the block
  // TRANSLATORS: ads/trackers settings disabled. The text enclosed in "**" will appear bold.
  // TRANSLATORS: Advanced settings refer to the name of the page with the title "Advanced".
  // TRANSLATORS: Available placeholders:
  // TRANSLATORS: %(customDnsFeatureName)s - The name displayed next to the custom DNS toggle.
  const blockingDisabledText = messages.pgettext(
    'vpn-settings-view',
    'Disable **%(customDnsFeatureName)s** (under Advanced settings) to activate these settings.',
  );

  return (
    <Cell.Footer>
      <AriaDescription>
        <Cell.FooterText>
          {formatMarkdown(sprintf(blockingDisabledText, { customDnsFeatureName }))}
        </Cell.FooterText>
      </AriaDescription>
    </Cell.Footer>
  );
}

function EnableIpv6() {
  const enableIpv6 = useSelector((state) => state.settings.enableIpv6);
  const { setEnableIpv6: setEnableIpv6Impl } = useAppContext();

  const setEnableIpv6 = useCallback(
    async (enableIpv6: boolean) => {
      try {
        await setEnableIpv6Impl(enableIpv6);
      } catch (e) {
        const error = e as Error;
        log.error('Failed to update enable IPv6', error.message);
      }
    },
    [setEnableIpv6Impl],
  );

  return (
    <AriaInputGroup>
      <Cell.Container>
        <AriaLabel>
          <Cell.InputLabel>{messages.pgettext('vpn-settings-view', 'Enable IPv6')}</Cell.InputLabel>
        </AriaLabel>
        <AriaInput>
          <Cell.Switch isOn={enableIpv6} onChange={setEnableIpv6} />
        </AriaInput>
      </Cell.Container>
      <Cell.Footer>
        <AriaDescription>
          <Cell.FooterText>
            {messages.pgettext(
              'vpn-settings-view',
              'Enable IPv6 communication through the tunnel.',
            )}
          </Cell.FooterText>
        </AriaDescription>
      </Cell.Footer>
    </AriaInputGroup>
  );
}

function KillSwitchInfo() {
  const [killSwitchInfoVisible, showKillSwitchInfo, hideKillSwitchInfo] = useBoolean(false);

  return (
    <>
      <Cell.CellButton onClick={showKillSwitchInfo}>
        <AriaInputGroup>
          <AriaLabel>
            <Cell.InputLabel>
              {messages.pgettext('vpn-settings-view', 'Kill switch')}
            </Cell.InputLabel>
          </AriaLabel>
          <StyledInfoIcon />
          <AriaInput>
            <Cell.Switch isOn disabled />
          </AriaInput>
        </AriaInputGroup>
      </Cell.CellButton>
      <ModalAlert
        isOpen={killSwitchInfoVisible}
        type={ModalAlertType.info}
        buttons={[
          <AppButton.BlueButton key="back" onClick={hideKillSwitchInfo}>
            {messages.gettext('Got it!')}
          </AppButton.BlueButton>,
        ]}
        close={hideKillSwitchInfo}>
        <ModalMessage>
          {messages.pgettext(
            'vpn-settings-view',
            'This built-in feature prevents your traffic from leaking outside of the VPN tunnel if your network suddenly stops working or if the tunnel fails, it does this by blocking your traffic until your connection is reestablished.',
          )}
        </ModalMessage>
        <ModalMessage>
          {messages.pgettext(
            'vpn-settings-view',
            'The difference between the Kill Switch and Lockdown Mode is that the Kill Switch will prevent any leaks from happening during automatic tunnel reconnects, software crashes and similar accidents. With Lockdown Mode enabled, you must be connected to a Mullvad VPN server to be able to reach the internet. Manually disconnecting or quitting the app will block your connection.',
          )}
        </ModalMessage>
      </ModalAlert>
    </>
  );
}

function LockdownMode() {
  const blockWhenDisconnected = useSelector((state) => state.settings.blockWhenDisconnected);
  const { setBlockWhenDisconnected: setBlockWhenDisconnectedImpl } = useAppContext();

  const [confirmationDialogVisible, showConfirmationDialog, hideConfirmationDialog] = useBoolean(
    false,
  );

  const setBlockWhenDisconnected = useCallback(
    async (blockWhenDisconnected: boolean) => {
      try {
        await setBlockWhenDisconnectedImpl(blockWhenDisconnected);
      } catch (e) {
        const error = e as Error;
        log.error('Failed to update block when disconnected', error.message);
      }
    },
    [setBlockWhenDisconnectedImpl],
  );

  const setLockDownMode = useCallback(
    async (newValue: boolean) => {
      if (newValue) {
        showConfirmationDialog();
      } else {
        await setBlockWhenDisconnected(false);
      }
    },
    [setBlockWhenDisconnected, showConfirmationDialog],
  );

  const confirmLockdownMode = useCallback(async () => {
    hideConfirmationDialog();
    await setBlockWhenDisconnected(true);
  }, [hideConfirmationDialog, setBlockWhenDisconnected]);

  return (
    <>
      <AriaInputGroup>
        <Cell.Container>
          <AriaLabel>
            <Cell.InputLabel>
              {messages.pgettext('vpn-settings-view', 'Lockdown mode')}
            </Cell.InputLabel>
          </AriaLabel>
          <AriaDetails>
            <InfoButton>
              <ModalMessage>
                {messages.pgettext(
                  'vpn-settings-view',
                  'The difference between the Kill Switch and Lockdown Mode is that the Kill Switch will prevent any leaks from happening during automatic tunnel reconnects, software crashes and similar accidents.',
                )}
              </ModalMessage>
              <ModalMessage>
                {messages.pgettext(
                  'vpn-settings-view',
                  'With Lockdown Mode enabled, you must be connected to a Mullvad VPN server to be able to reach the internet. Manually disconnecting or quitting the app will block your connection.',
                )}
              </ModalMessage>
            </InfoButton>
          </AriaDetails>
          <AriaInput>
            <Cell.Switch isOn={blockWhenDisconnected} onChange={setLockDownMode} />
          </AriaInput>
        </Cell.Container>
      </AriaInputGroup>
      <ModalAlert
        isOpen={confirmationDialogVisible}
        type={ModalAlertType.caution}
        buttons={[
          <AppButton.RedButton key="confirm" onClick={confirmLockdownMode}>
            {messages.gettext('Enable anyway')}
          </AppButton.RedButton>,
          <AppButton.BlueButton key="back" onClick={hideConfirmationDialog}>
            {messages.gettext('Back')}
          </AppButton.BlueButton>,
        ]}
        close={hideConfirmationDialog}>
        <ModalMessage>
          {messages.pgettext(
            'vpn-settings-view',
            'Attention: enabling this will always require a Mullvad VPN connection in order to reach the internet.',
          )}
        </ModalMessage>
        <ModalMessage>
          {messages.pgettext(
            'vpn-settings-view',
            'The app’s built-in kill switch is always on. This setting will additionally block the internet if clicking Disconnect or Quit.',
          )}
        </ModalMessage>
      </ModalAlert>
    </>
  );
}

function TunnelProtocolSetting() {
  const tunnelProtocol = useSelector((state) =>
    mapRelaySettingsToProtocol(state.settings.relaySettings),
  );
  const { updateRelaySettings } = useAppContext();

  const setTunnelProtocol = useCallback(async (tunnelProtocol: TunnelProtocol | undefined) => {
    const relayUpdate = RelaySettingsBuilder.normal()
      .tunnel.tunnelProtocol((config) => {
        if (tunnelProtocol) {
          config.tunnelProtocol.exact(tunnelProtocol);
        } else {
          config.tunnelProtocol.any();
        }
      })
      .build();
    try {
      await updateRelaySettings(relayUpdate);
    } catch (e) {
      const error = e as Error;
      log.error('Failed to update tunnel protocol constraints', error.message);
    }
  }, []);

  const tunnelProtocolItems: Array<ISelectorItem<TunnelProtocol | undefined>> = useMemo(
    () => [
      {
        label: messages.gettext('Automatic'),
        value: undefined,
      },
      {
        label: strings.wireguard,
        value: 'wireguard',
      },
      {
        label: strings.openvpn,
        value: 'openvpn',
      },
    ],
    [],
  );

  return (
    <AriaInputGroup>
      <StyledSelectorContainer>
        <Selector
          title={messages.pgettext('vpn-settings-view', 'Tunnel protocol')}
          values={tunnelProtocolItems}
          value={tunnelProtocol}
          onSelect={setTunnelProtocol}
        />
      </StyledSelectorContainer>
    </AriaInputGroup>
  );
}

function mapRelaySettingsToProtocol(relaySettings: RelaySettingsRedux) {
  if ('normal' in relaySettings) {
    const { tunnelProtocol } = relaySettings.normal;
    return tunnelProtocol === 'any' ? undefined : tunnelProtocol;
    // since the GUI doesn't display custom settings, just display the default ones.
    // If the user sets any settings, then those will be applied.
  } else if ('customTunnelEndpoint' in relaySettings) {
    return undefined;
  } else {
    throw new Error('Unknown type of relay settings.');
  }
}

function WireguardSettingsButton() {
  const history = useHistory();
  const tunnelProtocol = useSelector((state) =>
    mapRelaySettingsToProtocol(state.settings.relaySettings),
  );

  const navigate = useCallback(() => history.push(RoutePath.wireguardSettings), [history]);

  return (
    <Cell.CellNavigationButton onClick={navigate} disabled={tunnelProtocol === 'openvpn'}>
      <Cell.Label>
        {sprintf(
          // TRANSLATORS: %(wireguard)s will be replaced with the string "WireGuard"
          messages.pgettext('vpn-settings-view', '%(wireguard)s settings'),
          { wireguard: strings.wireguard },
        )}
      </Cell.Label>
    </Cell.CellNavigationButton>
  );
}

function OpenVpnSettingsButton() {
  const history = useHistory();
  const tunnelProtocol = useSelector((state) =>
    mapRelaySettingsToProtocol(state.settings.relaySettings),
  );

  const navigate = useCallback(() => history.push(RoutePath.openVpnSettings), [history]);

  return (
    <Cell.CellNavigationButton onClick={navigate} disabled={tunnelProtocol === 'wireguard'}>
      <Cell.Label>
        {sprintf(
          // TRANSLATORS: %(openvpn)s will be replaced with the string "OpenVPN"
          messages.pgettext('vpn-settings-view', '%(openvpn)s settings'),
          { openvpn: strings.openvpn },
        )}
      </Cell.Label>
    </Cell.CellNavigationButton>
  );
}
