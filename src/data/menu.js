/** Taken from the printed Dreamers Pizza menu. Prices in Rand. */

export const PIZZA_MENU = [
  {
    id: 'classic',
    title: 'Classic Pizzas',
    items: [
      { id: 'margherita', name: 'Margherita', desc: 'Tomato base, mozzarella cheese. Add mushrooms for a Dream taste.', large: 99.99, small: 59.99 },
      { id: 'hawaiian', name: 'Hawaiian', desc: 'Tomato base, mozzarella cheese, ham and pineapple.', large: 119.99, small: 59.99 },
      { id: 'bbq-chicken', name: 'BBQ Chicken', desc: 'Tomato base, mozzarella cheese, chicken, red onion, BBQ sauce.', large: 119.99, small: 59.99 },
      { id: 'chicken-mayo', name: 'Chicken Mayo', desc: 'Tomato base, mozzarella cheese, chicken, green pepper and mayo.', large: 119.99, small: 59.99 },
      { id: 'veggie-supreme', name: 'Veggie Supreme', desc: 'Tomato base, mozzarella cheese, mushrooms, green pepper, red onion and olives.', large: 109.99, small: 59.99 },
    ],
  },
  {
    id: 'signature',
    title: 'Signature Pizzas',
    items: [
      { id: 'hm-chicken-bacon', name: 'H&M Chicken and Bacon', desc: 'Tomato base, mozzarella cheese, chicken, bacon, red onion with honey-and-mustard sauce.', large: 129.99, small: 69.99 },
      { id: 'pepperoni', name: 'Pepperoni', desc: 'Tomato base, mozzarella and pepperoni.', large: 139.99, small: 79.99 },
      { id: 'the-dreamer', name: 'The Dreamer', desc: 'Tomato base, mozzarella cheese, chicken, bacon, olives, red onion, cherry tomato and mushrooms.', large: 149.99, small: 79.99, badge: 'New secret sauce' },
      { id: 'meat-feast', name: 'Meat Feast', desc: 'Tomato base, mozzarella, chicken, bacon, ham and BBQ sauce.', large: 149.99, small: 79.99 },
    ],
  },
];

export const SIDE_MENU = [
  {
    id: 'subs',
    title: 'Subs',
    items: [
      { name: 'The Dreamer', desc: 'Mozzarella cheese, chicken strips, bacon, lettuce, tomato, sweet chilli mayo.', price: 69.99 },
      { name: 'The Boss', desc: 'Mozzarella cheese, ham, pepperoni, red onion, green pepper and BBQ sauce.', price: 79.99 },
      { name: 'The Pizza', desc: 'Mozzarella cheese, chicken strips, mushrooms, green pepper and pizza sauce.', price: 69.99 },
    ],
  },
  {
    id: 'wings',
    title: 'Flame & Crunch',
    subtitle: 'Wings & Chips',
    items: [
      { name: '4 × Sticky BBQ Chicken Wings', desc: 'With chips (200g).', price: 79.99 },
      { name: '6 × Sticky BBQ Chicken Wings', desc: 'With chips (200g).', price: 99.99 },
    ],
  },
  {
    id: 'fries',
    title: 'Loaded Fries',
    subtitle: 'Fries and cheese sauce',
    items: [
      { name: 'Plain', price: 39.99 },
      { name: 'Chicken', price: 49.99 },
      { name: 'Bacon', price: 49.99 },
      { name: 'Spice it up with extra jalapeño', price: 7.99, addOn: true },
    ],
  },
  {
    id: 'popcorn',
    title: "Pop 'n Go",
    items: [
      { name: 'Medium Popcorn', price: 9.99 },
      { name: 'Large Popcorn', price: 14.99 },
      { name: 'Popcorn Combo', desc: 'Medium popcorn and 330ml drink.', price: 19.99 },
    ],
  },
  {
    id: 'drinks',
    title: 'Sip the Dream',
    items: [{ name: 'Iced Coffee', desc: '330ml', price: 44.99 }],
  },
];

export const DREAM_DEALS = [
  {
    id: 'study-break',
    name: 'Study Break Box',
    desc: 'Pizza sub, 4 × chicken wings, medium popcorn and a 330ml drink.',
    price: 129.99,
    tag: 'Fuel for the grind',
  },
  {
    id: 'day-dream',
    name: 'Day Dream Deal',
    desc: 'Any large classic pizza, 6 × chicken wings and a 500ml drink.',
    price: 209.99,
    tag: 'Feeds the squad',
  },
];

/** Blue Monday flyer: any 2 of these classics for R199 (Mondays only, takeaway only). */
export const BLUE_MONDAY = {
  price: 199,
  pizzas: [
    { name: 'Hawaiian', desc: 'Ham & pineapple on our classic base.' },
    { name: 'Regina', desc: 'Ham & mushrooms on our classic base.' },
    { name: 'BBQ Chicken', desc: 'BBQ chicken, red onion & mozzarella on BBQ sauce.' },
    { name: 'Chicken Mayo', desc: 'Chicken, onion & mozzarella with a creamy mayo drizzle.' },
    { name: 'Veggie Supreme', desc: 'Mushrooms, peppers, onion, olives & mozzarella.' },
    { name: 'Margherita', desc: 'Fresh mozzarella, oregano & basil. No sauce.' },
  ],
};

export const formatRand = (n) => `R${n.toFixed(2)}`;
