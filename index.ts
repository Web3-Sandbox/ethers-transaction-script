import "dotenv/config";
import { TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { BytesLike, Contract, ethers, utils } from "ethers";
import { bytecode, abi } from "./data";

const privateKey = process.env.PRIVATE_KEY as BytesLike;
const RPC = process.env.RPC as string;
const to = "0x000000000000000000000000000000000000dEaD";

if (!privateKey || !RPC) {
  console.log({ privateKey: privateKey, RPC: RPC });
  console.log("**** missing privateKey or RPC !! ****\n");
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(privateKey, provider);

function deployContract(): Promise<Contract> {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  return factory.deploy(utils.parseEther("1000"));
}

function transfer(address: string): Promise<TransactionResponse> {
  let erc20 = new ethers.Contract(address, abi, wallet);
  return erc20.transfer(to, utils.parseEther("0.0001"));
}

function sendTransaction(): Promise<TransactionResponse> {
  const tx: TransactionRequest = {
    to: to,
    value: utils.parseEther("0.0001"),
  };

  return wallet.sendTransaction(tx);
}

async function logInitial() {
  console.log("#########");
  console.log(`network: ${(await provider.getNetwork()).chainId}`);
  console.log(`address: ${wallet.address}`);
  console.log(`balance: ${utils.formatEther(await wallet.getBalance())}`);
  console.log(`transaction count: ${await wallet.getTransactionCount()}`);
  console.log("#########");
}

async function main() {
  await logInitial();

  // # One hundred transactions
  console.log("*** One hundred transactions ****");
  for (let i = 1; i <= 100; i++) {
    const tx = await sendTransaction();
    console.log(tx.nonce, i);
  }

  // # Ten time ten transactions
  console.log("\n*** Ten time ten transactions ****");
  for (let i = 1; i <= 10; i++) {
    const contract = await deployContract();
    await contract.deployTransaction.wait();
    console.log(contract.address, i);

    for (let j = 1; j <= 10; j++) {
      const tx = await transfer(contract.address);
      console.log(tx.nonce, i, j);
    }
  }

  // # One hundred contracts
  console.log("\n*** One hundred contracts ****");
  for (let i = 1; i <= 100; i++) {
    const contract = await deployContract();
    console.log(contract.address, i);
  }

  console.log("#### DONE ####");
}

main();
