import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'How to Start?',
    Svg: require('@site/static/img/rocket.svg').default,
    description: (
      <>
        Read the document and follow the instructions.
        Do it at your own pace.
        You can skip some exercises if you are already familiar with the content.
      </>
    ),
  },
  {
    title: 'I need help!',
    Svg: require('@site/static/img/hands-up.svg').default,
    description: (
      <>
        Ask questions!
      </>
    ),
  },
  {
    title: 'Done! What\'s next?',
    Svg: require('@site/static/img/medal.svg').default,
    description: (
      <>
        Let us know!
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
