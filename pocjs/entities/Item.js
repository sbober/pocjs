dojo.provide("pocjs.entities.Item");

dojo.declare("pocjs.entities.Item", null, {

    icon: null,
    color: null,
    name: null,
    description: null,
    
    constructor: function(icon, color, name, description) {
            this.icon = icon;
            this.color = color;
            this.name = name;
            this.description = description;
    }

});

dojo.mixin(pocjs.entities.Item, {
    none:       new pocjs.entities.Item(-1, 0xFFC363, "", ""), 
    powerGlove: new pocjs.entities.Item(0, 0xFFC363, "Power Glove", "Smaaaash!!"), 
    pistol:     new pocjs.entities.Item(1, 0xEAEAEA, "Pistol", "Pew, pew, pew!"), 
    flippers:   new pocjs.entities.Item(2, 0x7CBBFF, "Flippers", "Splish splash!"), 
    cutters:    new pocjs.entities.Item(3, 0xCCCCCC, "Cutters", "Snip, snip!"), 
    skates:     new pocjs.entities.Item(4, 0xAE70FF, "Skates", "Sharp!"),
    key:        new pocjs.entities.Item(5, 0xFF4040, "Key", "How did you get this?"), 
    potion:     new pocjs.entities.Item(6, 0x4AFF47, "Potion", "Healthy!")
});
