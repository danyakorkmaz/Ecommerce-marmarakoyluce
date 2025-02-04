import { isConstTypeReference } from "typescript";
import { ICartItem, cartModel } from "../models/cartModel";
// import { IOrderItem, orderModel } from "../models/orderModel";
import productModel from "../models/productModel";

interface CreateCartForUser {
  userID: string;
}

const createCartForUser = async ({ userID }: CreateCartForUser) => {
  const cart = await cartModel.create({ userID });
  await cart.save();
  return cart;

};



interface GetActiveCartForUser {
  userID: string;
}

export const getActiveCartForUser = async ({ userID, }: GetActiveCartForUser) => {
  let cart = await cartModel.findOne({ userID, status: "active" });
  if (!cart) {
    cart = await createCartForUser({ userID });
  }
  return cart;
};



// interface ClearCart {
//   userId: string;
// }


// export const clearCart = async ({ userId }: ClearCart) => {
//   const cart = await getActiveCartForUser({ userId })

//   cart.items = []

//   cart.totalAmount = 0

//   const updatedCart = await cart.save()

//   return { data: updatedCart, statusCode: 200 }

// }

/******************************************************************************************* */
// Post end point
interface AddItemToCart {
  productID: any;
  quantity: number;
  userID: string;
}

export const addItemToCart = async ({ productID, quantity, userID }: AddItemToCart) => {
  const cart = await getActiveCartForUser({ userID });

  const existsInCart = cart.items.find((p) => p.product.toString() === productID);  // Dose the item exist in the cart?

  if (existsInCart) {
    return { data: "Item already exists in cart !", statusCode: 400 };
  }

  const product = await productModel.findById(productID); // fetch the product

  if (!product) {
    return { data: "Product not found !", statusCode: 400 };
  }
  cart.items.push({
    product: productID,
    unitPrice: product.price,
    quantity: quantity,
    discount: 0
  });

  if (product.stockCount < quantity) {
    return { data: "Low stock for item!", statusCode: 400 };
  }

  // Update the totalPrice for the cart
  cart.totalPrice += product.price * quantity;
  // Update the totalCount for the cart
  cart.totalCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  const updatedCart = await cart.save();

  return { data: updatedCart, statusCode: 200 };
};



/******************************************************************************************* */

//Update end point
interface UpdateItemInCart {
  productID: any;
  quantity: number;
  userID: string;
}

export const updateItemInCart = async ({ productID, quantity, userID }: UpdateItemInCart) => {
  const cart = await getActiveCartForUser({ userID });

  const existsInCart = cart.items.find((p) => p.product.toString() === productID);

  if (!existsInCart) {
    return { data: "Item dosent exsit in cart", statusCode: 400 };
  }

  const product = await productModel.findById(productID);

  if (!product) {
    return { data: "Product not found !", statusCode: 400 };
  }

  if (product.stockCount < quantity) {
    return { data: "Low stock for item!", statusCode: 400 };
  }

  const otherCartItems = cart.items.filter((p) => p.product.toString() !== productID);

  existsInCart.quantity = quantity;

  //Calculate totalPrice and totalCount for the cart
  let total = calculateCartTotalItems({ cartItems: otherCartItems })
  cart.totalCount = calculateCartTotalCount({ cartItems: cart.items });


  total += existsInCart.quantity * existsInCart.unitPrice;

  cart.totalPrice = total;

  const updatedCart = await cart.save();

  return { data: updatedCart, statusCode: 200 };
}

                  /*************************************** */
const calculateCartTotalItems = ({ cartItems, }: { cartItems: ICartItem[]; }) => {
  const total = cartItems.reduce((sum, product) => {
    sum += product.quantity * product.unitPrice;
    return sum;
  }, 0);

  return total;
};

const calculateCartTotalCount = ({ cartItems }: { cartItems: ICartItem[] }) => {
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};

/******************************************************************************************* */


// //Delete end point
// interface DeleteItemInCart {
//   productId: any;
//   userId: string;
// }
// export const deleteItemInCart = async ({ userId, productId }: DeleteItemInCart) => {
//   const cart = await getActiveCartForUser({ userId });
//   const existsInCart = cart.items.find((p) => p.product.toString() === productId);
//   if (!existsInCart) {
//     return { data: "Item dosent exsit in cart", statusCode: 400 };
//   }
//   const otherCartItems = cart.items.filter((p) => p.product.toString() !== productId);

//   const total = calculateCartTotalItems({ cartItems: otherCartItems })

//   cart.items = otherCartItems;
//   cart.totalAmount = total;

//   const updatedCart = await cart.save();

//   return { data: updatedCart, statusCode: 200 };
// }



// //Create order
// interface Checkout {
//   userId: string;
//   address: string;
// }

// export const checkout = async ({ userId, address }: Checkout) => {

//   if (!address) {
//     return { data: "Please add the address", statusCode: 400 };
//   }

//   const cart = await getActiveCartForUser({ userId });

//   const orderItems: IOrderItem[] = []

//   //Loop cartItems and create orderItems
//   for (const item of cart.items) {
//     const product = await productModel.findById(item.product)

//     if (!product) {
//       return { data: "Product not found", statusCode: 400 }
//     }

//     const orderItem: IOrderItem = {
//       productTitle: product.title,
//       productImage: product.image,
//       quantity: item.quantity,
//       unitPrice: item.unitPrice,
//     }
//     orderItems.push(orderItem)
//   }
//   const order = await orderModel.create({
//     orderItems,
//     total: cart.totalAmount,
//     address,
//     userId,
//   })
//   await order.save();

//   //Update the cart status to be completed
//   cart.status = "completed";
//   await cart.save();
//   return { data: order, statusCode: 200 }
// }