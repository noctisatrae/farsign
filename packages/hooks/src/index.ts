import { useEffect, useState } from "react";
import { generateKeyPair, requestSignerAuthStatus, sendPublicKey } from "@farsign/utils";

const useToken = (clientName: string) => {

	const [fetchedToken, setFetchedToken] = useState({
		token: "",
		deepLink: ""
	});

	(async () => {
		const { publicKey } = await generateKeyPair();
		const {token, deepLinkUrl} = await sendPublicKey(publicKey, clientName);
		
		setFetchedToken({ token: token, deepLink: deepLinkUrl });
	})();

	return [fetchedToken, setFetchedToken]
}

const useSigner = (token: string) => {

	const [signer, setSigner] = useState({
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
}

export { useSigner, useToken };