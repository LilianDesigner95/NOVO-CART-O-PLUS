import {requireChatGPTUser} from '../chatgpt-auth';
import ShareLinks from './share-links';
export const metadata={title:'Links para titulares | Cartão Plus',robots:{index:false,follow:false}};
export default async function Page(){await requireChatGPTUser('/links');return <ShareLinks/>}
