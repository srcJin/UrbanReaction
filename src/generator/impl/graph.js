// import * as log from 'loglevel';
import * as isect from 'isect';
import * as d3 from 'd3-quadtree';
import Vector from '../vector';
console.log("-------------------");
console.log("graph.ts running!");
/**
 * Node located along any intersection or point along the simplified road polylines
 */
export class Node {
    constructor(value, neighbors = new Set()) {
        this.value = value;
        this.neighbors = neighbors;
        this.segments = new Set();
    }
    addSegment(segment) {
        this.segments.add(segment);
    }
    addNeighbor(node) {
        if (node !== this) {
            this.neighbors.add(node);
            node.neighbors.add(this);
        }
    }
}
export default class Graph {
    /**
     * Create a graph from a set of streamlines
     * Finds all intersections, and creates a list of Nodes
     */
    constructor(streamlines, dstep, deleteDangling = false) {
        const intersections = isect.bush(this.streamlinesToSegment(streamlines)).run();
        const quadtree = d3.quadtree().x(n => n.value.x).y(n => n.value.y);
        const nodeAddRadius = 0.001;
        // Add all segment start and endpoints
        for (const streamline of streamlines) {
            for (let i = 0; i < streamline.length; i++) {
                const node = new Node(streamline[i]);
                if (i > 0) {
                    node.addSegment(this.vectorsToSegment(streamline[i - 1], streamline[i]));
                }
                if (i < streamline.length - 1) {
                    node.addSegment(this.vectorsToSegment(streamline[i], streamline[i + 1]));
                }
                this.fuzzyAddToQuadtree(quadtree, node, nodeAddRadius);
            }
        }
        // Add all intersections
        for (const intersection of intersections) {
            const node = new Node(new Vector(intersection.point.x, intersection.point.y));
            for (const s of intersection.segments)
                node.addSegment(s);
            this.fuzzyAddToQuadtree(quadtree, node, nodeAddRadius);
        }
        // For each simplified streamline, build list of nodes in order along streamline
        for (const streamline of streamlines) {
            for (let i = 0; i < streamline.length - 1; i++) {
                const nodesAlongSegment = this.getNodesAlongSegment(this.vectorsToSegment(streamline[i], streamline[i + 1]), quadtree, nodeAddRadius, dstep);
                if (nodesAlongSegment.length > 1) {
                    for (let j = 0; j < nodesAlongSegment.length - 1; j++) {
                        nodesAlongSegment[j].addNeighbor(nodesAlongSegment[j + 1]);
                    }
                }
                else {
                    // console.log("streamline=",streamline)
                    console.log("Error Graph.js: segment with less than 2 nodes");
                }
            }
        }
        for (const n of quadtree.data()) {
            if (deleteDangling) {
                this.deleteDanglingNodes(n, quadtree);
            }
            n.adj = Array.from(n.neighbors);
        }
        this.nodes = quadtree.data();
        this.intersections = [];
        for (const i of intersections)
            this.intersections.push(new Vector(i.point.x, i.point.y));
    }
    /**
     * Remove dangling edges from graph to facilitate polygon finding
     */
    deleteDanglingNodes(n, quadtree) {
        if (n.neighbors.size === 1) {
            quadtree.remove(n);
            for (let neighbor of n.neighbors) {
                neighbor.neighbors.delete(n);
                this.deleteDanglingNodes(neighbor, quadtree);
            }
        }
    }
    /**
     * Given a segment, step along segment and find all nodes along it
     */
    getNodesAlongSegment(segment, quadtree, radius, step) {
        // Walk dstep along each streamline, adding nodes within dstep/2
        // and connected to this streamline (fuzzy - nodeAddRadius) to list, removing from
        // quadtree and adding them all back at the end
        const foundNodes = [];
        const nodesAlongSegment = [];
        const start = new Vector(segment.from.x, segment.from.y);
        const end = new Vector(segment.to.x, segment.to.y);
        const differenceVector = end.clone().sub(start);
        step = Math.min(step, differenceVector.length() / 2); // Min of 2 step along vector
        const steps = Math.ceil(differenceVector.length() / step);
        // const differenceVectorLength = differenceVector.length();
        for (let i = 0; i <= steps; i++) {
            let currentPoint = start.clone().add(differenceVector.clone().multiplyScalar(i / steps));
            // Order nodes, not by 'closeness', but by dot product
            let nodesToAdd = [];
            let closestNode = quadtree.find(currentPoint.x, currentPoint.y, radius + step / 2);
            while (closestNode !== undefined) {
                quadtree.remove(closestNode);
                foundNodes.push(closestNode);
                let nodeOnSegment = false;
                for (let s of closestNode.segments) {
                    if (this.fuzzySegmentsEqual(s, segment)) {
                        nodeOnSegment = true;
                        break;
                    }
                }
                if (nodeOnSegment) {
                    nodesToAdd.push(closestNode);
                }
                closestNode = quadtree.find(currentPoint.x, currentPoint.y, radius + step / 2);
            }
            nodesToAdd.sort((first, second) => this.dotProductToSegment(first, start, differenceVector) - this.dotProductToSegment(second, start, differenceVector));
            nodesAlongSegment.push(...nodesToAdd);
        }
        quadtree.addAll(foundNodes);
        return nodesAlongSegment;
    }
    fuzzySegmentsEqual(s1, s2, tolerance = 0.0001) {
        // From
        if (s1.from.x - s2.from.x > tolerance) {
            return false;
        }
        if (s1.from.y - s2.from.y > tolerance) {
            return false;
        }
        // To
        if (s1.to.x - s2.to.x > tolerance) {
            return false;
        }
        if (s1.to.y - s2.to.y > tolerance) {
            return false;
        }
        return true;
    }
    dotProductToSegment(node, start, differenceVector) {
        const dotVector = node.value.clone().sub(start);
        return differenceVector.dot(dotVector);
    }
    fuzzyAddToQuadtree(quadtree, node, radius) {
        // Only add if there isn't a node within radius
        // Remember to check for double radius when querying tree, or point might be missed
        const existingNode = quadtree.find(node.value.x, node.value.y, radius);
        if (existingNode === undefined) {
            quadtree.add(node);
        }
        else {
            for (const neighbor of node.neighbors)
                existingNode.addNeighbor(neighbor);
            for (const segment of node.segments)
                existingNode.addSegment(segment);
        }
    }
    streamlinesToSegment(streamlines) {
        const out = [];
        for (const s of streamlines) {
            for (let i = 0; i < s.length - 1; i++) {
                out.push(this.vectorsToSegment(s[i], s[i + 1]));
            }
        }
        return out;
    }
    vectorsToSegment(v1, v2) {
        return {
            from: v1,
            to: v2
        };
    }
}
