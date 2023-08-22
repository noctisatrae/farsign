# @farsign/hooks - documentation
@farsign/hooks is package aiming at helping you implement sign-in with Farcaster with ease. In order to achieve this, we have created several React hooks:
- `useToken`: This hooks allows you to get a token used by `useSigner` for the authentification flow and a link that you can render as a QR code that the user will use to add the app to their Farcaster account!
- `useSigner`: This hooks provide an object containing all sort of useful information (`base64SignedMessage`) allowing you for example, to user's cast and do something with that.
- `useCheckSigner`: This token is used to find out whether or not the user is connected, it's useful to determine what to show to the user.
- `useEncryptedSigner`: In order to publish a cast for the user, you need to go through a lot of steps that are simplified in this hook. Basically, it gets the privateKey of the signer from `localStorage` and transform it into a Uint8Array usable with Farcaster. All of this, only if the user is connected!

If you need an example of a React app using @farsign/hooks to retrieve casts and publish them, go check the exemple folder of the repository!

## `useToken` - The cornerstone of the authentification flow!
```jsx
import { useToken } from "@farsign/hooks";

const CLIENT_NAME = "YOUR_APP_NAME"

const App = () => {
    // Why would you edit our beautiful token? You can still do it, but no need to destructure it from useToken if you don't need it!    
    const [token, _setToken] = useToken(CLIENT_NAME);
    
    return (
        <>
            {(token.token === "") ? <a href={token.deepLink}>Sign-in with Farcaster</a> : <p>Waiting for the token to load</p>}
        </>
    )
}
```
If you try to connect using this link on your computer it won't work because it is not yet implemented. What you should do is render a QR-Code using another package and use it to connect with your phone using Warpcast. This is what I did!, and remember when testing don't forget to delete the app as you add them to you account. If you don't to this you'll be overwhelmed by amount you created lol

Now, you may not want to show this when the user is connected... so it leads us to the next step!

## `useCheckSigner` - Don't show things your users don't need!
Let's take the previous example and add more things: 
```jsx
import { useToken, useCheckSigner } from "@farsign/hooks";

const CLIENT_NAME = "YOUR_APP_NAME";

const App = () => {
    const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
    const [token, _setToken] = useToken(CLIENT_NAME);
    
    return (
        <>
            {/* If the user is not connected we show the sign-in link, if they are, we show a CAPS-LOCK message */}
            {(isConnected === false) ? 
                (token.token === "") ? 
                    <a href={token.deepLink}>Sign-in with Farcaster</a> 
                    : 
                    <p>Waiting for the token to load</p>
                : 
                <p>We're ALREADY connected!</p>
            }
        </>
    )
}
```

## `useSigner` - This has less and less uses over time, it's more of a utility honestly.
Basically, you still need to use it because it allows you to get the user's fid and the base64SignedMessage that allows to register in a hub. Actually, it's very useful - forget what I said.
```jsx
import { useToken, useCheckSigner, useSigner } from "@farsign/hooks";

const CLIENT_NAME = "YOUR_APP_NAME";

const App = () => {
    const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
    const [token, _setToken] = useToken(CLIENT_NAME);
    const [signer, _setSigner] = useSigner(CLIENT_NAME, token);
    
    // useSigner allows you to know when the user accepted the sign-in request so you can set the isConnected variable 
    // for your UI to react accordingly to the changes!
    useEffect(() => {
        if (signer.isConnected === true) {
            setIsConnected(true);
        }
    }, [signer])
    
    return (
        <>
            {/* If the user is not connected we show the sign-in link, if they are, we show a CAPS-LOCK message */}
            {(isConnected === false) ? 
                (token.token === "") ? 
                    <a href={token.deepLink}>Sign-in with Farcaster</a> 
                    : 
                    <p>Waiting for the token to load</p>
                : 
                <p>We're ALREADY connected!</p>
            }
        </>
    )
}
```

## `useEncryptedSigner` - The key to send message to the hub!
> How is this different than `useSigner`: `useEncryptedSigner` does not return any useful information, it just serves the purpose to return a signer compatible with the makeCastAdd() function that allows you to publish a cast.

Let's take our previous example and implement a button to cast to the hub!
```jsx
import { useToken, useCheckSigner, useSigner, useEncryptedSigner } from "@farsign/hooks";
import { FarcasterNetwork, getHubRpcClient, Message, makeCastAdd, NobleEd25519Signer } from '@farcaster/hub-web';

const CLIENT_NAME = "YOUR_APP_NAME";

const App = () => {
    const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
    const [token, _setToken] = useToken(CLIENT_NAME);
    const [signer, _setSigner] = useSigner(CLIENT_NAME, token);
    const [encryptedSigner, _setEncryptedSigner] = useEncryptedSigner(CLIENT_NAME, token);
    
    // useSigner allows you to know when the user accepted the sign-in request so you can set the isConnected variable 
    // for your UI to react accordingly to the changes!
    useEffect(() => {
        if (signer.isConnected === true) {
            setIsConnected(true);
        }
    }, [signer])
    
    return (
        <>
            {/* If the user is not connected we show the sign-in link, if they are, we show a CAPS-LOCK message */}
            {(isConnected === false) ? 
                (token.token === "") ? 
                    <a href={token.deepLink}>Sign-in with Farcaster:</a> 
                    : 
                    <p>Waiting for the token to load</p>
                : 
                <button onClick={() => {
                    // This localStorage data was registered by useSigner!
                    const request: SignerData = JSON.parse(localStorage.getItem("farsign-signer-" + CLIENT_NAME)!).signerRequest;
                    const client = getHubRpcClient("https://galaxy.ditti.xyz:2285"); // awesome hub 

                    const castBody = "Hey! Did you hear about this incredible package @farsign/hooks? The one that allows you to easily implement sign-in with Farcaster!"

                    const cast = (await makeCastAdd({
                        text: castBody,
                        embeds: [],
                        embedsDeprecated: [],
                        mentions: [],
                        mentionsPositions: [],
                    }, { fid: request.fid, network: FarcasterNetwork.MAINNET }, (encryptedSigner as NobleEd25519Signer) ))._unsafeUnwrap();

                    // I don't know why it creates an error, this is not due to @farsign/hooks...
                    // @ts-expect-error
                    client.submitMessage(cast);
                }}>Send a cast to show your joy!</button>
            }
        </>
    )
}
```

Woaah! You really implemented sign-in with Farcaster and casting from your app as easily as that? 