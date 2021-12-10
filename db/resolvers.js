const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/Users');
const Product = require('../models/Product');
const Client = require('../models/Clients');
const Order = require('../models/Order');

const createToken = (user, expiresIn) => {
    const { id, email, name, surname } = user;

    return jwt.sign({ id, email, name, surname }, process.env.TOKEN_SECRET, {
        expiresIn,
    });
};

module.exports = {
    Query: {
        getUser: async (_, { token }) => {
            const userId = jwt.verify(token, process.env.TOKEN_SECRET);
            return userId;
        },
        getProducts: async () => {
            try {
                const products = await Product.find({});
                return products;
            } catch (error) {
                console.error(error);
            }
        },
        getProduct: async (_, { id }) => {
            const product = await Product.findById(id);
            if (!product) throw new Error('Product not found');

            return product;
        },
        getClients: async () => {
            try {
                const clients = await Client.find({});
                return clients;
            } catch (error) {
                console.error(error);
            }
        },
        getSellerClients: async (_, {}, ctx) => {
            try {
                const clients = await Client.find({
                    seller: ctx.verifiedUser.id.toString(),
                });
                return clients;
            } catch (error) {
                console.error(error);
            }
        },
        getClient: async (_, { id }, ctx) => {
            const client = await Client.findById(id);

            if (!client) throw new Error('Client not found');
            if (
                !ctx.verifiedUser ||
                client.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            return client;
        },
        getOrders: async () => {
            try {
                const orders = await Order.find({});
                return orders;
            } catch (error) {
                console.error(error);
            }
        },
        getOrdersBySeller: async (_, {}, ctx) => {
            if (!ctx.verifiedUser) throw new Error('Not authorized!');

            try {
                const orders = await Order.find({
                    seller: ctx.verifiedUser.id,
                });
                return orders;
            } catch (error) {
                console.error(error);
            }
        },
        getOrderById: async (_, { id }, ctx) => {
            const order = await Order.findById(id);

            if (!order) throw new Error('Order not found');
            if (
                !ctx.verifiedUser ||
                order.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            return order;
        },
        getOrderByStatus: async (_, { status }, ctx) => {
            if (!ctx.verifiedUser) throw new Error('Not authorized!');
            const orders = await Order.find({
                seller: ctx.verifiedUser.id,
                status,
            });
            return orders;
        },
        bestClients: async () => {
            const clients = await Order.aggregate([
                { $match: { status: 'COMPLETED' } },
                {
                    $group: {
                        _id: '$client',
                        total: { $sum: '$total' },
                    },
                },
                {
                    $lookup: {
                        from: 'clients',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'clients',
                    },
                },
                {
                    $limit: 10,
                },
                {
                    $sort: { total: -1 },
                },
            ]);

            return clients;
        },
        bestSellers: async () => {
            const sellers = await Order.aggregate([
                { $match: { status: 'COMPLETED' } },
                {
                    $group: {
                        _id: '$seller',
                        total: { $sum: '$total' },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'sellers',
                    },
                },
                {
                    $limit: 10,
                },
                {
                    $sort: { total: -1 },
                },
            ]);

            return sellers;
        },
        searchProduct: async (_, { query }) => {
            const products = await Product.find({
                $text: { $search: query },
            }).limit(10);

            return products;
        },
    },
    Mutation: {
        newUser: async (_, { input }) => {
            const { email, password } = input;

            const userExists = await User.findOne({ email });
            if (userExists) throw new Error('User already exits!');

            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            try {
                const user = new User(input);
                user.save();
                return user;
            } catch (error) {
                console.error(error);
            }
        },
        authUser: async (_, { input }) => {
            const { email, password } = input;

            const userExists = await User.findOne({ email });
            if (!userExists) throw new Error('Wrong email or password');

            const verifiedPassword = await bcryptjs.compare(
                password,
                userExists.password
            );
            if (!verifiedPassword) throw new Error('Wrong email or password');

            return {
                token: createToken(userExists, '24h'),
            };
        },
        newProduct: async (_, { input }) => {
            try {
                const product = new Product(input);
                const result = await product.save();

                return result;
            } catch (error) {
                console.error(error);
            }
        },
        updateProduct: async (_, { id, input }) => {
            let product = await Product.findById(id);
            if (!product) throw new Error('Product not found');

            product = await Product.findOneAndUpdate({ _id: id }, input, {
                new: true,
            });

            return product;
        },
        removeProduct: async (_, { id }) => {
            const product = await Product.findById(id);
            if (!product) throw new Error('Product not found');

            await Product.findOneAndDelete({ _id: id });

            return `Product with id: ${id} successfully removed.`;
        },
        newClient: async (_, { input }, ctx) => {
            const { email } = input;
            const client = await Client.findOne({ email });

            if (client) throw new Error('Client already exits');

            try {
                const newClient = new Client(input);
                newClient.seller = ctx.verifiedUser.id;
                const result = await newClient.save();

                return result;
            } catch (error) {
                console.error(error);
            }
        },
        updateClient: async (_, { id, input }, ctx) => {
            let client = await Client.findById(id);

            if (!client) throw new Error('Client not found');
            if (
                !ctx.verifiedUser ||
                client.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            client = await Client.findByIdAndUpdate({ _id: id }, input, {
                new: true,
            });

            return client;
        },
        removeClient: async (_, { id }, ctx) => {
            const client = await Client.findById(id);

            if (!client) throw new Error('Client not found');
            if (
                !ctx.verifiedUser ||
                client.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            try {
                await Client.findByIdAndRemove({ _id: id });
                return `Client with id: ${id} successfully removed.`;
            } catch (error) {
                console.error(error);
            }
        },
        newOrder: async (_, { input }, ctx) => {
            const { client } = input;

            const verifiedClient = await Client.findById(client);

            if (!verifiedClient) throw new Error('Client not found');
            if (
                !ctx.verifiedUser ||
                verifiedClient.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            let orderTotal;

            for await (const order of input.order) {
                const { id } = order;

                const product = await Product.findById(id);

                if (order.quantity > product.stock) {
                    throw new Error(`Not enough ${product.name} in stock`);
                } else {
                    product.stock = product.stock - order.quantity;
                    await product.save();

                    orderTotal = product.price * order.quantity;
                }
            }

            const newOrder = new Order(input);
            newOrder.seller = ctx.verifiedUser.id;
            newOrder.total = orderTotal.toFixed(2);

            const result = await newOrder.save();
            return result;
        },
        updateOrder: async (_, { id, input }, ctx) => {
            const { client } = input;

            const orderExits = await Order.findById(id);
            if (!orderExits) throw new Error('Order not found');

            const clientExists = await Client.findById(client);
            if (!clientExists) throw new Error('Client not found');

            if (
                !ctx.verifiedUser ||
                clientExists.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            let orderTotal;

            for await (const order of input.order) {
                const { id, quantity } = order;

                const product = await Product.findById(id);

                orderExits.order.find((p) => {
                    if (p.id === id) {
                        product.stock = product.stock + p.quantity;
                    }
                });

                if (quantity > product.stock) {
                    throw new Error(`Not enough ${product.name} in stock`);
                } else {
                    product.stock = product.stock - quantity;
                    await product.save();

                    orderTotal = product.price * quantity;
                }
            }

            input.total = orderTotal.toFixed(2);

            const result = await Order.findByIdAndUpdate({ _id: id }, input, {
                new: true,
            });

            return result;
        },

        removeOrder: async (_, { id }, ctx) => {
            const order = await Order.findById(id);

            if (!order) throw new Error('Order not found');
            if (
                !ctx.verifiedUser ||
                order.seller.toString() !== ctx.verifiedUser.id
            )
                throw new Error('Not authorized!');

            try {
                await Order.findByIdAndRemove({ _id: id });
                return `Order with id: ${id} successfully removed.`;
            } catch (error) {
                console.error(error);
            }
        },
    },
};
