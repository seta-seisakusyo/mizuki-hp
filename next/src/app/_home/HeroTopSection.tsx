"use client";

import { Box } from "@mui/material";
import Image from "next/image";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

interface Slide {
  image: string;
  alt: string;
}

const HeroTopSection: React.FC = () => {
  const slides: Slide[] = [
    { image: "/top/image1.jpg", alt: "みずきクリニック外観" },
    { image: "/top/image2.jpg", alt: "待合室" },
    { image: "/top/image3.jpg", alt: "診察室" },
    { image: "/top/image4.jpg", alt: "医療設備" },
    { image: "/top/image5.jpg", alt: "院内風景" },
    { image: "/top/image6.jpg", alt: "スタッフ" },
  ];

  return (
    <Box
      component="section"
      aria-label="クリニック紹介スライドショー"
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "800px",
          height: "550px",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 4000 }}
          pagination={{ clickable: true }}
          speed={800}
          style={{ width: "100%", height: "100%" }}
          a11y={{
            enabled: true,
            prevSlideMessage: "前のスライド",
            nextSlideMessage: "次のスライド",
            paginationBulletMessage: "スライド{{index}}に移動",
          }}
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.image}>
              <Box
                sx={{
                  position: "relative",
                  height: "500px",
                  width: "100%",
                }}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 800px) 100vw, 800px"
                  style={{ objectFit: "cover" }}
                  priority={slide.image === "/top/image1.jpg"}
                />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
};

export default HeroTopSection;
