import './App.css'
import { useCheckSigner, useToken, useSigner, useKeypair, RequestSignatureParameters } from "@farsign/hooks";
import { makeCastAdd, getHubRpcClient, FarcasterNetwork } from "@farcaster/hub-web";
import QRCode from "react-qr-code";
import { useEffect} from 'react';

const CLIENT_NAME = "";
const APP_FID = 10626;
const MNEMONIC = "";
const HUB = "";
const DEADLINE = Math.floor(Date.now() / 1000) + 86400;// signature is valid for 1 day you might want to extend this

const params: RequestSignatureParameters = {
  appFid: APP_FID,
  appMnemonic: MNEMONIC,
  deadline: DEADLINE,
  name: CLIENT_NAME
}

const sendCast = async (encryptedSigner: any) => {
  const castBody = "Getting closer and closer to something clean with my project tonight!";
  const hub = getHubRpcClient(HUB);
  
  const request = JSON.parse(localStorage.getItem("farsign-" + CLIENT_NAME)!);
  
  const cast = (await makeCastAdd({
    text: castBody,
    embeds: [],
    embedsDeprecated: [],
    mentions: [],
    mentionsPositions: [],
  }, { fid: request.userFid, network: FarcasterNetwork.MAINNET }, encryptedSigner))._unsafeUnwrap();

  hub.submitMessage(cast);
}

function App() {
  const [keys, encryptedSigner] = useKeypair(CLIENT_NAME);
  const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
  const [token] = useToken(CLIENT_NAME, params, keys!);
  const [signer] = useSigner(CLIENT_NAME, token);

  useEffect(() => {
    if (typeof signer?.signerRequest == 'object') {
      setIsConnected(true)
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
              <p>{}</p>
              <button onClick={() => sendCast(encryptedSigner)}>Send cast!</button>
            </div>
          </>
        }
      </div>
    </>
  )
}

export default App