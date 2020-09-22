import BigNumber from "bignumber.js";
import { tStringDecimalUnits, tStringCurrencyUnits } from "./types";

export const currencyUnitsToDecimals = (
  value: BigNumber,
  decimals: number
): tStringDecimalUnits =>
  new BigNumber(value).multipliedBy(new BigNumber(10).pow(decimals)).toFixed();

export const decimalsToCurrencyUnits = (
  value: BigNumber,
  decimals: number
): tStringCurrencyUnits =>
  new BigNumber(value).div(new BigNumber(10).pow(decimals)).toFixed();
