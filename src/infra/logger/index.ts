import pino from "pino";
import { loggerOptions } from "../../config/logger";

export const logger = pino(loggerOptions);
