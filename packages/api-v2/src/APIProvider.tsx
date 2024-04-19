import React, { PropsWithChildren, createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
// @ts-expect-error `@deriv/deriv-api` is not in TypeScript, Hence we ignore the TS error.
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { getAppId, getSocketURL } from '@deriv/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    TSocketEndpointNames,
    TSocketError,
    TSocketRequestPayload,
    TSocketResponseData,
    TSocketSubscribableEndpointNames,
} from '../types';
import { hashObject } from './utils';
import WSClient from './ws-client/ws-client';

type TSubscribeFunction = <T extends TSocketSubscribableEndpointNames>(
    name: T,
    payload?: TSocketRequestPayload<T>
) => Promise<{
    id: string;
    subscription: {
        unsubscribe: () => void;
        subscribe: (onData: (response: TSocketResponseData<T>) => void) => { unsubscribe: () => void };
    };
}>;

type TUnsubscribeFunction = (id: string) => void;

type APIContextData = {
    derivAPI: DerivAPIBasic | null;
    subscribe: TSubscribeFunction;
    unsubscribe: TUnsubscribeFunction;
    queryClient: QueryClient;
    setOnReconnected: (onReconnected: () => void) => void;
    setOnConnected: (onConnected: () => void) => void;
    connection: WebSocket;
    wsClient: WSClient;
};

/**
 * Retrieves the WebSocket URL based on the current environment.
 * @returns {string} The WebSocket URL.
 */
const getWebSocketURL = () => {
    const endpoint = getSocketURL();
    const app_id = getAppId();
    const language = localStorage.getItem('i18n_language');
    return `wss://${endpoint}/websockets/v3?app_id=${app_id}&l=${language}&brand=deriv`;
};

const APIContext = createContext<APIContextData | null>(null);

/**
 * Initializes a derivAPIRef instance for the global window. This enables a standalone connection
 * without causing race conditions with deriv-app core stores.
 * @returns {derivAPIRefBasic} The initialized derivAPIRef instance.
 */
const initializeDerivAPI = (onWSClose: () => void, onOpen?: () => void): DerivAPIBasic => {
    const wss_url = getWebSocketURL();

    const connection = new WebSocket(wss_url);
    connection.addEventListener('close', () => {
        onWSClose?.();
    });

    connection.addEventListener('open', () => {
        onOpen?.();
    });

    const result = new DerivAPIBasic({ connection });

    return result;
};

/**
 * TODO: standlone no longer exists, as its always standalone,
 * but I do not want to remove it from all packages withint this PR, so needs to be cleaned up in subsequent PRs
 */
type TAPIProviderProps = {
    /** If set to true, the APIProvider will instantiate it's own socket connection. */
    standalone?: boolean;
};

const APIProvider = ({ children }: PropsWithChildren<TAPIProviderProps>) => {
    const [reconnect, setReconnect] = useState(false);
    const derivAPIRef = useRef<DerivAPIBasic>();
    const subscriptionsRef = useRef<Record<string, DerivAPIBasic['subscribe']>>();
    const reactQueryRef = useRef<QueryClient>();

    // on reconnected ref
    const onReconnectedRef = useRef<() => void>();
    const onConnectedRef = useRef<() => void>();
    const isOpenRef = useRef<boolean>(false);
    const wsClientRef = useRef<WSClient>();

    if (!reactQueryRef.current) {
        reactQueryRef.current = new QueryClient({
            defaultOptions: {
                queries: {
                    refetchOnWindowFocus: false,
                    refetchOnReconnect: false,
                },
            },
        });
    }

    // have to be here and not inside useEffect as there are places in code expecting this to be available
    if (!derivAPIRef.current) {
        derivAPIRef.current = initializeDerivAPI(
            () => setReconnect(true),
            () => {
                isOpenRef.current = true;
                if (onConnectedRef.current) {
                    onConnectedRef.current();
                    onConnectedRef.current = undefined;
                }
            }
        );
    }

    if (!wsClientRef.current) {
        wsClientRef.current = new WSClient(derivAPIRef.current.connection);
    }

    useEffect(() => {
        return () => {
            derivAPIRef.current.disconnect();
            reactQueryRef.current?.clear();
        };
    }, []);

    const setOnReconnected = useCallback((onReconnected: () => void) => {
        onReconnectedRef.current = onReconnected;
    }, []);

    const setOnConnected = useCallback((onConnected: () => void) => {
        if (isOpenRef.current) {
            onConnected();
        } else {
            onConnectedRef.current = onConnected;
        }
    }, []);

    const subscribe: TSubscribeFunction = async (name, payload) => {
        const id = await hashObject({ name, payload });
        const matchingSubscription = subscriptionsRef.current?.[id];
        if (matchingSubscription) return { id, subscription: matchingSubscription };

        const { payload: _payload } = payload ?? {};

        const result = {
            id,
            subscription: {
                subscribe: (onData: (response: TSocketResponseData<TSocketSubscribableEndpointNames>) => void) => {
                    return wsClientRef.current?.subscribe(name, _payload, onData);
                },
                unsubscribe: () => {
                    unsubscribe(id);
                },
            },
        };

        subscriptionsRef.current = { ...(subscriptionsRef.current ?? {}), ...{ [id]: result.subscription } };
        return result;
    };

    const unsubscribe: TUnsubscribeFunction = id => {
        const matchingSubscription = subscriptionsRef.current?.[id];
        if (matchingSubscription) matchingSubscription.unsubscribe();
    };

    useEffect(() => {
        const currentDerivAPIRef = derivAPIRef.current;
        const currentSubscriptionsRef = subscriptionsRef.current;

        return () => {
            if (currentSubscriptionsRef) {
                Object.keys(currentSubscriptionsRef).forEach(key => {
                    currentSubscriptionsRef[key].unsubscribe();
                });
            }
            if (currentDerivAPIRef && currentDerivAPIRef.connection.readyState === 1) currentDerivAPIRef.disconnect();
        };
    }, []);

    useEffect(() => {
        const interval_id: ReturnType<typeof setInterval> = setInterval(
            () => derivAPIRef.current?.send({ ping: 1 }),
            10000
        );
        return () => clearInterval(interval_id);
    }, []);

    useEffect(() => {
        let reconnectTimerId: NodeJS.Timeout;
        if (reconnect) {
            derivAPIRef.current = initializeDerivAPI(
                () => {
                    reconnectTimerId = setTimeout(() => setReconnect(true), 500);
                },
                () => {
                    if (onReconnectedRef.current) {
                        onReconnectedRef.current();
                    }
                }
            );
            setReconnect(false);
        }

        return () => clearTimeout(reconnectTimerId);
    }, [reconnect]);

    return (
        <APIContext.Provider
            value={{
                derivAPI: derivAPIRef.current,
                subscribe,
                unsubscribe,
                queryClient: reactQueryRef.current,
                setOnReconnected,
                setOnConnected,
                connection: derivAPIRef.current?.connection,
                wsClient: wsClientRef.current,
            }}
        >
            <QueryClientProvider client={reactQueryRef.current}>
                {children}
                {/* <ReactQueryDevtools /> */}
            </QueryClientProvider>
        </APIContext.Provider>
    );
};

export const useAPIContext = () => {
    const context = useContext(APIContext);
    if (!context) {
        throw new Error('useAPIContext must be used within APIProvider');
    }
    return context;
};

export default APIProvider;
