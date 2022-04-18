import { Children, cloneElement } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import * as styles from "./Image.css";

type PositioningValue = "left" | "center" | "right";
interface SharedProps {
  align?: PositioningValue;
  bordered?: boolean;
  caption?: string;
}

export type ImageProps = SharedProps & NextImageProps;

export const Image = ({
  align = "left",
  bordered,
  caption,
  ...props
}: ImageProps) => {
  return (
    <span className={styles.wrapper({ align })}>
      {bordered ? (
        <span className={styles.border}>
          <NextImage {...props} layout="intrinsic" />
        </span>
      ) : (
        <NextImage {...props} layout="intrinsic" />
      )}
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </span>
  );
};

type ImageComponent = React.ReactElement<typeof Image>;

export type FigureProps = ImageProps & {
  children: ImageComponent;
};

export const Figure = ({ children, ...rest }: FigureProps) => {
  const image = Children.only<ImageComponent>(children);

  return cloneElement(image, rest);
};
