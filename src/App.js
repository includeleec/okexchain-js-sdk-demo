import OKEXChainClient, { crypto } from "@okexchain/javascript-sdk";
import { Button, Input, Typography } from "antd";
import _ from "lodash";
import React, { useState } from "react";
import ReactFileReader from "react-file-reader";
import "./App.css";





const { Title } = Typography;

// okexchain config
const nativeDenom = "okt";
const defaultTestnetFee = {
  amount: [
    {
      amount: "0.050000000000000000",
      denom: nativeDenom,
    },
  ],
  gas: "500000",
};
const defaultMainnetFee = {
  amount: [
    {
      amount: "0.000500000000000000",
      denom: nativeDenom,
    },
  ],
  gas: "500000",
};
const defaultFee = defaultMainnetFee;


const serverUrl = "https://exchaintest.okexcn.com"
const serverUrlMainnet = "https://www.okex.com"

const clientConfig = {
  chainId: "okexchain-65",
  relativePath: "/okexchain-test/v1",
  isMainnet: false,
}

const clientConfigMainnet = {
  chainId: "okexchain-66",
  relativePath: "/okexchain/v1",
  isMainnet: true,
}

const App = () => {
  const [pw, setPW] = useState("Ok12345678");
  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [okAccount, setOkAccount] = useState();
  const [depositAmount, setDepositAmount] = useState("");

  // ok account okt balance
  const [balance, setBalance] = useState(0);

  const okClient = new OKEXChainClient(serverUrlMainnet, clientConfigMainnet);
  // console.log('okClient', okClient)

  // load keystore json file
  const handleFiles = (files) => {
    const f = files[0];

    const fr = new FileReader();

    fr.onload = async (e) => {
      const data = e.target.result;
      // console.log("keystore", data);

      getPrivateKey(data, pw);
    };

    fr.readAsText(f);
  };

  const getPrivateKey = async (keystore, password) => {
    try {
      const prvKey = crypto.getPrivateKeyFromKeyStore(keystore, password);
      console.log("privateKey", prvKey);

      const pubKey = crypto.getAddressFromPrivateKey(prvKey);
      console.log("address", pubKey);

      // save keystore to localstorage
      localStorage.setItem("account", keystore);

      // set public key to localstorage
      localStorage.setItem("address", pubKey);

      // set private key
      setPrivateKey(prvKey);

      setPublicKey(pubKey);

      // get ok account instance
      const okAcc = await okClient.setAccountInfo(prvKey);
      console.log("okAccount", okAcc);

      try {
        const coins = await okClient.getBalance(pubKey);

        // get okt
        const oktBalance = _.find(coins, { denom: "okt" });

        if (oktBalance) {
          console.log("okt balance", oktBalance.amount);

          setBalance(Number(oktBalance.amount));

          setDepositAmount(Number(oktBalance.amount));
        }
      } catch (err) {
        console.log("get balance err", err);
      }

      setOkAccount(okAcc);
    } catch (err) {
      const errMsg = err.toString();
      if (errMsg.indexOf("invalid password") !== -1) {
        console.log("invalid password");
      } else if (
        errMsg.indexOf("Cannot read property 'kdfparams' of undefined") !== -1
      ) {
        console.log("invalid keystore");
      }
    }
  };

  const handleDeposit = async () => {
    if (okAccount) {

      // const sequenceNumber = await okAccount.getSequenceNumber(publicKey)

      const msg = [
        {
          type: "okexchain/staking/MsgDeposit",
          value: {
            delegator_address: publicKey,
            quantity: {
              amount: okAccount.formatNumber(0.01),
              denom: "okt"
            }
          }
        }
      ];

      console.log("deposit okAccount", await okAccount.getAccount());
      console.log("deposit msg", msg);

      const memo = "";
      const fee = defaultFee;

      const signedTx = await okAccount.buildTransaction(msg, msg, memo, fee, null);
      console.log("deposit signed tx", signedTx);
      const res = await okAccount.sendTransaction(signedTx);
      console.log("deposit res", res);
    } else {
      console.log("ok account is null");
    }
  };

    // add shares to validators
    const handleAddShares = async () => {
      if (okAccount) {
        let validators = [
          "okexchainvaloper1vsjcts3ga8dgf6nj2q7vmlrnu5en4cnedc8n76",
          "okexchainvaloper188dhgmaq8cka2yczzjfzsw0nely6y8ua3ad0du",
          "okexchainvaloper1evazeyntpfr62avj65dwd6mcw9wvh24kgehuwy",
          "okexchainvaloper1v5pvu4rkzc5axd6f7ngxa39je6d0lyujxv9sgu",
          "okexchainvaloper1w5zu7xxzfdx729elg2lu4rnltjsvzpdgp9x6xa",
          "okexchainvaloper1vlzgq74y6hm9crhkkhdjy77uvyqa0zdu3c6tmx",
          "okexchainvaloper1fwvre7w2na66fq3k2wjy30rzp07c4fl94yqvt6",
          "okexchainvaloper14kpvn0zr75594rlrl66lw953mlkrq6qzys686x",
          "okexchainvaloper1xaxvu9wxr8szym3aqdesvqq968y2tf5300clxz",
          "okexchainvaloper1hw0y28hgzadpmjwa68sfukdp69pc68cnkweqym"
        ]
        const msg = [
          {
            type: "okexchain/staking/MsgAddShares",
            value: {
              delegator_address: publicKey,
              validator_addresses: validators
            }
          }
        ];
  
        console.log("add-shares msg", msg);
  
        const memo = "";
        const fee = defaultFee;
  
        const signedTx = await okAccount.buildTransaction(msg, msg, memo, fee);
        console.log("add-shares signed tx", signedTx);
        const res = await okAccount.sendTransaction(signedTx);
        console.log("add-shares res", res);
      } else {
        console.log("ok account is null");
      }
    };

  // delegate to proxy
  const handleDelegate = async () => {
    if (okAccount) {
      const msg = [
        {
          type: "okexchain/staking/MsgBindProxy",
          value: {
            delegator_address: publicKey,
            proxy_address: "okexchain1u9efan0a3jc67jcql4d7h03gv3g3ets6gfcj9m"
          }
        }
      ];

      console.log("delegate msg", msg);

      const memo = "";
      const fee = defaultFee;

      const signedTx = await okAccount.buildTransaction(msg, msg, memo, fee);
      console.log("delegate signed tx", signedTx);
      const res = await okAccount.sendTransaction(signedTx);
      console.log("delegate res", res);
    } else {
      console.log("ok account is null");
    }
  };

  const handleWithdraw = async () => {
    if (okAccount) {
      const msg = [
        {
          type: "okexchain/staking/MsgWithdraw",
          value: {
            delegator_address: publicKey,
            quantity: {
              amount: "0.000000000000000000",
              denom: "okt"
            }
          }
        }
      ];

      console.log("withdraw msg", msg);

      const memo = "";
      const fee = defaultFee;

      const signedTx = await okAccount.buildTransaction(msg, msg, memo, fee);
      console.log("withdraw signed tx", signedTx);
      const res = await okAccount.sendTransaction(signedTx);
      console.log("withdraw res", res);
    } else {
      console.log("ok account is null");
    }
  };


  const handleTransfer= async () => {
    if (okAccount) {

      const userAddress = "okexchain1u9efan0a3jc67jcql4d7h03gv3g3ets6gfcj9m"
      const memo = "hello world";

      const res = await okAccount.sendSendTransaction(userAddress, "1.00000000", "okt", memo)
      console.log("transfer res", res);
    } else {
      console.log("ok account is null");
    }
  };

  return (
    <div className="App">
      <Title>OKexchain vote demo</Title>

      <ReactFileReader
        fileTypes={[".json", ".txt"]}
        multipleFiles={false}
        handleFiles={handleFiles}
      >
        <Button>Upload</Button>
      </ReactFileReader>

      <br />
      <Input
        onChange={(e) => setPW(e.target.value)}
        value={pw}
        maxLength="200"
        placeholder="keystore password"
      />

      <label>{publicKey}</label>

      {okAccount ? (
        <div>
          <div>
            <label>okt: {balance}</label>
          </div>

          <div>
            <Button onClick={handleDeposit}>deposit</Button>
            <Input
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="deposit okt amount"
            />
          </div>

          <div>
            <Button onClick={handleAddShares}>addShares</Button>
          </div>

          <div>
            <Button onClick={handleDelegate}>delegate</Button>
          </div>

          <div>
            <Button onClick={handleWithdraw}>withdraw</Button>
          </div>


          <div>
            <Button onClick={handleTransfer}>transfer</Button>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default App;
