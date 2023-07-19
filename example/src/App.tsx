import './App.css'
import { useCheckSigner, useToken, useSigner, useEncryptedSigner } from "@farsign/hooks";
import { makeCastAdd, getHubRpcClient, FarcasterNetwork, Message, NobleEd25519Signer } from "@farcaster/hub-web";
import QRCode from "react-qr-code";
import { useEffect } from 'react';

const CLIENT_NAME = "Example"

const sendCast = async (encryptedSigner: NobleEd25519Signer) => {
  const castBody = "I finally fixed galaxy.ditty.xyz with a lot of help from Alex! It was really hard but we made it... and now, I can use @farsign/hooks to send this message ;)";
  const hub = getHubRpcClient("https://galaxy.ditti.xyz:2285");
  
  const request = JSON.parse(localStorage.getItem("farsign-signer-" + CLIENT_NAME)!).signerRequest;
  
  const cast = (await makeCastAdd({
    text: castBody,
    embeds: [],
    embedsDeprecated: [],
    mentions: [],
    mentionsPositions: [],
  }, { fid: request.fid, network: FarcasterNetwork.MAINNET }, (encryptedSigner as NobleEd25519Signer) ))._unsafeUnwrap();

  // @ts-expect-error
  hub.submitMessage(cast);
}

function App() {
  const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
  const [token] = useToken(CLIENT_NAME);
  const [signer] = useSigner(CLIENT_NAME, token);
  const [encryptedSigner] = useEncryptedSigner(CLIENT_NAME, token);
  
  useEffect(() => {
    if (signer.isConnected === true) {
      setIsConnected(true); // if Typescript is naughty with you, you can write this: (setIsConnected as Dispatch<SetStateAction<boolean>>)(true);
    }
  }, [signer])
    
  
  return (
    <>
      <div>
        {(isConnected === false) ? 
          <>
            <QRCode value={token.deepLink}/>
            <p>Sign-in with Farcaster</p>
          </>
          :
          <>
            <div className="card">
              <button onClick={() => sendCast(encryptedSigner)}>Send cast to express your joy!</button>
            </div>
          </>
        }
      </div>
    </>
  )
}

export default App
