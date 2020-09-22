import { ethers } from "ethers";
import { tEthereumAddress } from "./types";

export interface iVoteParams {
  proposalId: number;
  vote: number; // 0 Abstain, 1 Yes, 2 No
  voter: tEthereumAddress;
  votingAsset: tEthereumAddress;
  nonce: number;
}

export interface iCancelVoteParams {
  proposalId: number;
  voter: tEthereumAddress;
  nonce: number;
}

export interface iHashedParamsWithSignature {
  hashedParams: string;
  arrayifiedHashedParams: Uint8Array;
  signature: string;
}

export const getHexStringHashFromParams = (
  types: string[],
  params: any[]
): string => {
  // Packing of the voting params using the same format as the result from abi.encodePacked()
  //  in Solidity https://solidity.readthedocs.io/en/v0.5.4/abi-spec.html#abi-packed-mode
  const solidityPackedParams = ethers.utils.solidityPack(types, params);

  // Hashing of the packed parameters using the same keccak256 Solidity hashing function
  // The result is a 66-bytes long string, not suitable yet to submit as bytes32 to the contract
  //  https://solidity.readthedocs.io/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions
  return ethers.utils.keccak256(solidityPackedParams);
};

// Ganache has a inconsistency on the V component of the signature, returning 27 or 28 on eth_sign, instead
// of 0 or 1, which lead the ercrecover in the Solidity contracts to fail. This function checks the presence
// of 27 or 28 and converts it to 0 or 1
export const modifiedSignatureIfGanache = (serializedSignature: string) => {
  const { r, s, recoveryParam, v } = ethers.utils.splitSignature(
    serializedSignature
  );
  return v && v > 1
    ? ethers.utils.joinSignature({
        r,
        s,
        recoveryParam,
        v: v - 27
      })
    : serializedSignature;
};

export const getHexStringHashFromVoteParams = ({
  proposalId,
  vote,
  voter,
  votingAsset,
  nonce
}: iVoteParams) =>
  getHexStringHashFromParams(
    ["uint256", "uint256", "address", "address", "uint256"],
    [proposalId, vote, voter, votingAsset, nonce]
  );

export const getHashAndSignatureFromVoteParams = async (
  { proposalId, vote, voter, votingAsset, nonce }: iVoteParams,
  wallet: ethers.Wallet
): Promise<iHashedParamsWithSignature> => {
  const submitVoteHashedParams = getHexStringHashFromVoteParams({
    proposalId,
    vote,
    voter,
    votingAsset,
    nonce
  });

  // Conversion of the previous hex string to 32 entry Uint8Array, needed for the signature generation
  const arrayifiedParams = ethers.utils.arrayify(submitVoteHashedParams);

  const signature = await signSubmitVoteHashedParams(wallet, arrayifiedParams);

  return {
    hashedParams: submitVoteHashedParams,
    arrayifiedHashedParams: arrayifiedParams,
    signature: modifiedSignatureIfGanache(signature)
  };
};

export const getHexStringHashFromCancelVoteParams = ({
  proposalId,
  voter,
  nonce
}: iCancelVoteParams) =>
  getHexStringHashFromParams(
    ["uint256", "address", "uint256"],
    [proposalId, voter, nonce]
  );

export const getHashAndSignatureFromCancelVoteParams = async (
  { proposalId, voter, nonce }: iCancelVoteParams,
  wallet: ethers.Wallet
): Promise<iHashedParamsWithSignature> => {
  const cancelVoteHashedParams = getHexStringHashFromCancelVoteParams({
    proposalId,
    voter,
    nonce
  });

  // Conversion of the previous hex string to 32 entry Uint8Array, needed for the signature generation
  const arrayifiedParams = ethers.utils.arrayify(cancelVoteHashedParams);

  const signature = await signSubmitVoteHashedParams(wallet, arrayifiedParams);

  return {
    hashedParams: cancelVoteHashedParams,
    arrayifiedHashedParams: arrayifiedParams,
    signature: modifiedSignatureIfGanache(signature)
  };
};

export const signSubmitVoteHashedParams = async (
  wallet: ethers.Wallet,
  arrayifiedHashedParams: Uint8Array
): Promise<string> => await wallet.signMessage(arrayifiedHashedParams);

export const isSignatureValid = (
  arrayifiedHash: Uint8Array,
  signature: string,
  signer: tEthereumAddress
): boolean => ethers.utils.verifyMessage(arrayifiedHash, signature) === signer;
