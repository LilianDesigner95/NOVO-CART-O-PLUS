import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Cartão Plus — Sua fatura, conferida',description:'Organize pessoas, cartões, parcelas e estornos com conferência de cada centavo.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg'},appleWebApp:{capable:true,title:'Cartão Plus',statusBarStyle:'default'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
