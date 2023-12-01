import './App.css'
import { useCheckSigner, useToken, useSigner, useEncryptedSigner } from "@farsign/hooks";
import { makeCastAdd, getHubRpcClient, FarcasterNetwork, NobleEd25519Signer } from "@farcaster/hub-web";
import QRCode from "react-qr-code";
import { useEffect } from 'react';

const CLIENT_NAME = "Example"

const sendCast = async (encryptedSigner: NobleEd25519Signer) => {
  const castBody = "farsign is baaack :) !";
  const hub = getHubRpcClient("https://834f9d.hubs-web.neynar.com:2285");
  
  const request = JSON.parse(localStorage.getItem("farsign-" + CLIENT_NAME)!);
  
  const cast = (await makeCastAdd({
    text: castBody,
    embeds: [],
    embedsDeprecated: [],
    mentions: [],
    mentionsPositions: [],
  }, { fid: request.userFid, network: FarcasterNetwork.MAINNET }, (encryptedSigner as NobleEd25519Signer) ))._unsafeUnwrap();

  hub.submitMessage(cast);
}

function App() {
  const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
  const [token] = useToken(CLIENT_NAME, 10626, "reduce fancy mail reunion patrol horn assist leopard youth erupt ethics aspect suggest hint pulse current buyer then this inch drastic sell antique little");
  const [signer] = useSigner(CLIENT_NAME, token);
  const [encryptedSigner] = useEncryptedSigner(CLIENT_NAME, token);

  console.log(token)

  useEffect(() => {
    if (signer?.isConnected === true) {
      setIsConnected(true);
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
              {/* @ts-expect-error */}
              <button onClick={() => sendCast(encryptedSigner!)}>Send cast!</button>
            </div>
          </>
        }
      </div>
    </>
  )
}

export default App
