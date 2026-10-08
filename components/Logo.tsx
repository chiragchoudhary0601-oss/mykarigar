import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/logo.jpeg"
      alt="MyKarigar"
      width={180}
      height={60}
      className="h-10 w-auto object-contain"
      priority
    />
  );
}