import { createClient } from '@blinkdotnew/sdk';
import { createBlinkClient, type BlinkEnvironment } from './config';

const runtimeEnvironment = (import.meta as ImportMeta & { env?: BlinkEnvironment }).env ?? {};

export const blink = createBlinkClient(runtimeEnvironment, createClient);
