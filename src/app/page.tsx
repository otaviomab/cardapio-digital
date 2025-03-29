import { redirect } from 'next/navigation'
import Image from "next/image";

export default function Home() {
  // Por padrão, redireciona para o slug do restaurante
  // Posteriormente você pode configurar isso via variável de ambiente
  redirect('/restaurante-demo')
}
