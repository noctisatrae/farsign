import { requestSignerAuthStatus } from "@warp-sign/utils"
import { useState } from "react";

const useSignerStatus = async (token: string) => {
    const [signerStatus, setSignerStatus] = useState<Boolean>();

    setSignerStatus(await requestSignerAuthStatus(token));

    return [signerStatus, setSignerStatus];
}  

export {useSignerStatus};