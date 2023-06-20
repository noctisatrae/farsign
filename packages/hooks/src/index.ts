import { useEffect, useState } from "react";
import { generateKeyPair, requestSignerAuthStatus, sendPublicKey, getPublicKeyAsync, bytesToHexString, hexStringToBytes } from "@farsign/utils";

type Token = {
  token: string,
  deepLink: string
}

type SignerData = {
  token: string,
  publicKey: string,
  timestamp: number,
  name: string,
  fid: number,
  messageHash: string,
  base64SignedMessage: string
}

type Signer = {
  signer: SignerData,
  isConnected: boolean
}

const useToken = (clientName: string) => {

  const [fetchedToken, setFetchedToken] = useState<Token>({
    token: "",
    deepLink: ""
  });

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("privateKey-farsign") === null) {
        const { publicKey, privateKey } = await generateKeyPair();
        const {token, deepLinkUrl} = await sendPublicKey(publicKey, clientName);
        
        localStorage.setItem("privateKey-farsign", bytesToHexString(privateKey)._unsafeUnwrap());

        setFetchedToken({ token: token, deepLink: deepLinkUrl });
      } else {

        const privateKey = localStorage.getItem("privateKey-farsign");
        
        // console.log("GETTING FROM LOCALSTORAGE " + privateKey)
        
        const publicKey = await getPublicKeyAsync(hexStringToBytes(privateKey!)._unsafeUnwrap());
        
        const {token, deepLinkUrl} = await sendPublicKey(publicKey, clientName);
        setFetchedToken({ token: token, deepLink: deepLinkUrl });
      }
    })();
  }, []);

  return [fetchedToken, setFetchedToken]
}

const useSigner = (token: string) => {

  const [signer, setSigner] = useState<Signer>({
     signer: {
      token: "",
      publicKey: "",
      timestamp: 0,
      name: "",
      fid: 0,
      messageHash: "",
      base64SignedMessage: ""
     },
     isConnected: false
  });

  useEffect(() => {
    (async () => {
      if (token.length > 0) {
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 3000));
  
          const data = await requestSignerAuthStatus(token);
  
          if (data.result && data.result.signerRequest.base64SignedMessage) {
            setSigner({
              signer: data.result.signerRequest,
              isConnected: true
            });
            break
          }
        }
      }
    })()
  }, [token])

  return [signer, setSigner]
}

export { useSigner, useToken };
export type { Token, Signer, SignerData };