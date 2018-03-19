import React, { Component } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = 0.4 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
  }

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      },
    });

    this.state = { panResponder, position, index: 0 };
  }

  componentWillReceiveProps(nextProps) {
    // if new cards are received reset the index
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const item = data[this.state.index];

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    this.state.position.setValue({ x: 0, y: 0 });
    this.setState({ index: this.state.index + 1 });
  }

  getCardStyle() {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: ['-60deg', '0deg', '60deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  }

  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 },
    }).start();
  }

  forceSwipe(direction) {
    const x = direction === 'right' ? SCREEN_WIDTH * 2 : -SCREEN_WIDTH * 2;
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
    }).start(() => this.onSwipeComplete(direction));
  }

  renderNoMoreCards() {
    if (this.props.renderNoMoreCards) {
      return this.props.renderNoMoreCards();
    }
    return (
      <Text>No more cards</Text>
    );
  }

  renderCards() {
    // if all available cards have been swiped show the user a message
    if (this.state.index >= this.props.data.length) {
      return this.renderNoMoreCards();
    }

    return this.props.data.map((item, i) => {
      // if the cards have already been swiped return null
      if (i < this.state.index) { return null; }

      // if the card is the current card attach the animation
      if (i === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
            {...this.state.panResponder.panHandlers}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }

      // if the card is still in the deck go ahead and render
      return (
        <Animated.View
          key={item.id}
          style={[styles.cardStyle, { zIndex: 5 }]}
        >
          {this.props.renderCard(item)}
        </Animated.View>
      );
    }).reverse();
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.renderCards()}
      </View>
    );
  }
}

const styles = {
  cardStyle: {
    flex: 1,
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.95,
    alignSelf: 'center',
  },
};

export default Deck;
