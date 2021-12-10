const { gql } = require('apollo-server');

module.exports = gql`
    type User {
        id: ID
        name: String
        surname: String
        email: String
        createdAt: String
    }

    type Token {
        token: String
    }

    type Product {
        id: ID
        name: String
        stock: Int
        price: Float
        createdAt: String
    }

    type Client {
        id: ID
        name: String
        surname: String
        email: String
        company: String
        createdAt: String
        phoneNumber: String
        seller: ID
    }

    type Order {
        id: ID
        order: [Orders]
        total: Float
        client: ID
        seller: ID
        date: String
        status: OrderStatus
    }

    type Orders {
        id: ID
        quantity: Int
    }

    type TopClients {
        total: Float
        clients: [Client]
    }

    type TopSellers {
        total: Float
        sellers: [User]
    }

    input UserInput {
        name: String!
        surname: String!
        email: String!
        password: String!
    }

    input AuthInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    input ClientInput {
        name: String!
        surname: String!
        company: String!
        email: String!
        phoneNumber: String
    }

    input OrderProductInput {
        id: ID
        quantity: Int
    }

    input OrderInput {
        order: [OrderProductInput]!
        total: Float
        client: ID!
        status: OrderStatus
    }

    enum OrderStatus {
        PENDING
        COMPLETED
        CANCELLED
    }

    type Query {
        # Users
        getUser(token: String!): User

        # Products
        getProducts: [Product]
        getProduct(id: ID!): Product

        # Clients
        getClients: [Client]
        getSellerClients: [Client]
        getClient(id: ID!): Client

        # Orders
        getOrders: [Order]
        getOrdersBySeller: [Order]
        getOrderById(id: ID!): Order
        getOrderByStatus(status: OrderStatus!): [Order]

        # Advanced Queries
        bestClients: [TopClients]
        bestSellers: [TopSellers]
        searchProduct(query: String!): [Product]
    }

    type Mutation {
        # Users
        newUser(input: UserInput): String
        authUser(input: AuthInput): Token

        # Products
        newProduct(input: ProductInput): Product
        updateProduct(id: ID!, input: ProductInput): Product
        removeProduct(id: ID!): String

        # Clients
        newClient(input: ClientInput): Client
        updateClient(id: ID!, input: ClientInput): Client
        removeClient(id: ID!): String

        # Orders
        newOrder(input: OrderInput): Order
        updateOrder(id: ID!, input: OrderInput): Order
        removeOrder(id: ID!): String
    }
`;
