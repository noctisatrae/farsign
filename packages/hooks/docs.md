# @farsign/hooks - documentation
@farsign/hooks is package aiming at helping you implement sign-in with Farcaster with ease. In order to achieve this, we have created several React hooks:

- `useKeypair(clientName: string)`: In a Farcaster app, for one user, you have one keypair identifying them. This hooks returns a new keypair & the associated signer if the user has never connected with Farcaster in your app. If they already have, the keypair will be fetched from `localStorage` at the key `farsign-privateKey` and the keypair + the encrypted signer recreated from the private key.
- `useCheckSigner(clientName: string)`: It returns a boolean and a setter, allowing you to know and to decide when you consider the user connected. 
- `useToken(clientName: string, params: RequestSignatureParameters)`: Probably one of the most important hook that returns the information you need to make a working QR code for authentification.
- `useSigner(clientName: string, token: Token)`: The core of @farsign/hooks, allowing to get the signer, with all the information about the user thanks to the `SignedKeyRequest` type. It checks if the user has scanned the QR code and if they have accepted the connection.

If you need an example of a React app using @farsign/hooks to retrieve casts and publish them, go check the example folder of the repository!

## `useKeypair`+`useCheckSigner` - *To get the keys* & and check if connected
```jsx
import { useKeypair, useCheckSigner } from "@farsign/hooks";

const CLIENT_NAME = "YOUR_APP_NAME"

const App = () => {
    const [keys, encryptedSigner] = useKeypair(CLIENT_NAME);
    const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);

    return (
        <>
            {(isConnected === false) ? <p>What's the next step?<p>}
        </>
    )
}
```

## `useToken` - Make the QR Code 
Let's take the previous example and add more things: 
```jsx
import { useToken, useCheckSigner, useToken } from "@farsign/hooks";

const CLIENT_NAME = "YOUR_APP_NAME";

const App = () => {
    const [keys, encryptedSigner] = useKeypair(CLIENT_NAME);
    const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
    const [token] = useToken(CLIENT_NAME);
    
    return (
        <>
            {/* If the user is not connected we show the sign-in link, if they are, we show a CAPS-LOCK message */}
            {(isConnected === false) ?  
                <a href={token.deepLink}>Sign-in with Farcaster</a>
                : 
                <p>We're ALREADY connected!</p>
            }
        </>
    )
}
```

## `useSigner` - Impressively versatile!
Allows you to get the signer, and get the information of the user.
```jsx
import { useToken, useCheckSigner, useToken, useSigner } from '@farsign/hooks';
import { useEffect } from 'react';

const CLIENT_NAME = "YOUR_APP_NAME";

const App = () => {
    const [keys, encryptedSigner] = useKeypair(CLIENT_NAME);
    const [isConnected, setIsConnected] = useCheckSigner(CLIENT_NAME);
    const [token] = useToken(CLIENT_NAME);
    const [signer] = useSigner(CLIENT_NAME, token);

    useEffect(() => {
        if (typeof signer?.signerRequest == 'object') {
            setIsConnected(true) // set connected when we get a signer from Warpcast!
        }
    }, [signer])

    return (
        <>
            {/* If the user is not connected we show the sign-in link, if they are, we show a CAPS-LOCK message */}
            {(isConnected === false) ?  
                <a href={token.deepLink}>Sign-in with Farcaster</a>
                : 
                <p>We're ALREADY connected!</p>
            }
        </>
    )
}
```